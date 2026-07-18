/**
 * Native Cloudflare rate limiting for the public self-IP route.
 *
 * Workers KV is intentionally not used for this counter because it permits
 * only one write per second to the same key. The binding is configured for
 * 10 requests per 60 seconds in Wrangler and is local to each edge location.
 */

import type { Context, Next } from 'hono';
import type { Env } from '../types/env.js';
import { sha256 } from '../lib/hash.js';
import { getIPVersion } from '../lib/ip-utils.js';

export async function ipIntelRateLimit(
  c: Context<{ Bindings: Env }>,
  next: Next
): Promise<Response> {
  const limiter = c.env.IP_INTEL_RATE_LIMITER;
  const address = c.req.header('CF-Connecting-IP')?.trim() || '';

  // The handler owns the generic invalid-address response. Missing limiter
  // config degrades to first-party connection facts without calling IPBot.
  if (!limiter || getIPVersion(address) === null) {
    await next();
    return c.res;
  }

  let outcome: RateLimitOutcome;
  try {
    outcome = await limiter.limit({ key: await sha256(address) });
  } catch {
    console.error('Native IP intel rate limiter unavailable');
    return c.json(
      {
        success: false,
        error: 'Connection check unavailable',
        code: 'RATE_LIMIT_STORAGE_UNAVAILABLE',
        message: 'The connection check is temporarily unavailable.',
      },
      503
    );
  }

  c.header('X-RateLimit-Limit', '10');
  if (!outcome.success) {
    c.header('X-RateLimit-Remaining', '0');
    c.header('Retry-After', '60');
    return c.json(
      {
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please wait before trying again.',
        retry_after: 60,
      },
      429
    );
  }

  await next();
  return c.res;
}
