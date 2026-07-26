/**
 * GET /api/health - Health check endpoint
 * Used for monitoring and uptime checks
 */

import { Hono } from 'hono';
import type { Env } from '../types/env.js';
import { healthLimiter } from '../middleware/rate-limit.js';

const health = new Hono<{ Bindings: Env }>();

// Apply rate limiting to all health routes
health.use('*', healthLimiter);

/**
 * GET /api/health - Basic health check
 */
health.get('/', async c => {
  const startTime = Date.now();

  try {
    // Test D1 connection
    const dbStart = Date.now();
    const dbCheck = await c.env.DB.prepare('SELECT 1 as ok').first<{ ok: number }>();
    const dbLatency = Date.now() - dbStart;
    const dbOk = dbCheck?.ok === 1;

    // Surface the GDPR deletion backlog: a queue that stops draining is a
    // compliance problem the cron logs alone would not make visible.
    const queue = await c.env.DB.prepare(
      `SELECT
         COUNT(*) as pending,
         COALESCE(MAX(retry_count), 0) as max_retry_count,
         MIN(created_at) as oldest_created_at
       FROM deletion_requests
       WHERE status = 'pending'`
    ).first<{ pending: number; max_retry_count: number; oldest_created_at: number | null }>();

    const pending = queue?.pending ?? 0;
    const oldestCreatedAt = queue?.oldest_created_at ?? null;

    return c.json({
      status: dbOk ? 'healthy' : 'degraded',
      timestamp: Date.now(),
      latency_ms: Date.now() - startTime,
      environment: c.env.ENVIRONMENT || 'unknown',
      checks: {
        database: dbOk ? 'ok' : 'error',
        db_latency_ms: dbLatency,
        deletion_queue: {
          pending,
          max_retry_count: queue?.max_retry_count ?? 0,
          oldest_pending_age_ms:
            pending > 0 && oldestCreatedAt !== null ? Date.now() - oldestCreatedAt : 0,
        },
      },
    });
  } catch {
    return c.json(
      {
        status: 'unhealthy',
        timestamp: Date.now(),
        latency_ms: Date.now() - startTime,
        environment: c.env.ENVIRONMENT || 'unknown',
        checks: {
          database: 'error',
        },
      },
      503
    );
  }
});

/**
 * GET /api/health/ready - Readiness probe
 */
health.get('/ready', async c => {
  try {
    await c.env.DB.prepare('SELECT 1').first();
    return c.json({ ready: true });
  } catch {
    return c.json({ ready: false }, 503);
  }
});

/**
 * GET /api/health/live - Liveness probe
 */
health.get('/live', c => {
  return c.json({ alive: true });
});

export default health;
