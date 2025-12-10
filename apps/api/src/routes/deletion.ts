/**
 * POST /api/deletion - Opt-out & deletion requests
 * Allows users to queue deletion of their fingerprint hashes (GDPR/CCPA support)
 */

import { Hono } from 'hono';
import type { Env } from '../types/env.js';
import { DeletionRequestSchema } from '../lib/validation.js';
import { uuidv4 } from '../lib/hash.js';
import { deletionLimiter } from '../middleware/rate-limit.js';

const deletion = new Hono<{ Bindings: Env }>();

deletion.use('*', deletionLimiter);

/**
 * Queue a deletion request
 */
deletion.post('/', async c => {
  const db = c.env.DB;

  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json(
      {
        success: false,
        error: 'Invalid JSON',
        code: 'JSON_PARSE_ERROR',
        message: 'Request body must be valid JSON',
      },
      400
    );
  }

  const parsed = DeletionRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: parsed.error.issues.slice(0, 5).map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
      400
    );
  }

  const { hash_type, hash_value, email, reason } = parsed.data;
  const normalizedHash = hash_value.toLowerCase();

  // Prevent duplicate requests for the same hash
  const existing = await db
    .prepare(
      'SELECT id, status, created_at, completed_at FROM deletion_requests WHERE hash_type = ? AND hash_value = ? ORDER BY created_at DESC LIMIT 1'
    )
    .bind(hash_type, normalizedHash)
    .first<{ id: string; status: string; created_at: number; completed_at?: number }>();

  if (existing) {
    return c.json({
      success: true,
      data: {
        id: existing.id,
        status: existing.status,
        created_at: existing.created_at,
        completed_at: existing.completed_at ?? null,
        duplicate: true,
      },
      message: 'Request already queued for this hash. We will process it shortly.',
    });
  }

  const id = uuidv4();
  const now = Date.now();

  const insert = await db
    .prepare(
      `INSERT INTO deletion_requests (id, hash_type, hash_value, email, reason, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`
    )
    .bind(id, hash_type, normalizedHash, email || null, reason || null, now)
    .run();

  if (!insert.success) {
    return c.json(
      {
        success: false,
        error: 'Database error',
        code: 'DB_INSERT_FAILED',
        message: 'Unable to queue deletion request',
      },
      500
    );
  }

  return c.json({
    success: true,
    data: {
      id,
      status: 'pending',
      created_at: now,
      sla_hours: 24,
    },
    message: 'Deletion request queued. We aim to complete it within 24 hours.',
  });
});

/**
 * Check deletion request status
 */
deletion.get('/:id', async c => {
  const db = c.env.DB;
  const id = c.req.param('id');

  if (!id) {
    return c.json(
      {
        success: false,
        error: 'Missing id',
        code: 'MISSING_ID',
        message: 'Request id is required',
      },
      400
    );
  }

  const record = await db
    .prepare('SELECT id, status, created_at, completed_at, hash_type FROM deletion_requests WHERE id = ? LIMIT 1')
    .bind(id)
    .first<{ id: string; status: string; created_at: number; completed_at?: number; hash_type: string }>();

  if (!record) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        code: 'REQUEST_NOT_FOUND',
        message: 'Deletion request not found',
      },
      404
    );
  }

  return c.json({
    success: true,
    data: {
      id: record.id,
      hash_type: record.hash_type,
      status: record.status,
      created_at: record.created_at,
      completed_at: record.completed_at ?? null,
    },
  });
});

export default deletion;
