/**
 * Require a usable Cloudflare client address in production.
 *
 * Routes that write to D1 or queue deletions are keyed and rate limited per
 * connection. Without CF-Connecting-IP every caller collapses into the same
 * 'unknown' bucket, which turns per-IP limits into a single shared quota, so
 * production rejects the request instead of accepting an unattributable write.
 *
 * Header-only check with no I/O: cheap enough to run ahead of the rate limiter.
 */

import type { Context, Next } from 'hono';
import type { Env } from '../types/env.js';
import { isValidIP } from '../lib/ip-utils.js';

export async function requireClientIP(
  c: Context<{ Bindings: Env }>,
  next: Next
): Promise<Response | void> {
  if (c.env.ENVIRONMENT !== 'production') return next();

  const address = c.req.header('CF-Connecting-IP')?.trim() || '';
  if (isValidIP(address)) return next();

  return c.json(
    {
      success: false,
      error: 'Client IP unavailable',
      code: 'CLIENT_IP_UNAVAILABLE',
    },
    403
  );
}
