/**
 * Rate limiting middleware for API protection
 * Uses Cloudflare KV for distributed rate limiting across all edge locations
 */

import { Context, Next } from 'hono';
import type { Env } from '../types/env.js';
import { sha256 } from '../lib/hash.js';
import { getClientIP } from '../lib/ip-utils.js';

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Native Cloudflare Rate Limiting binding used in production */
  binding:
    | 'ANALYZE_RATE_LIMITER'
    | 'DELETION_RATE_LIMITER'
    | 'STATS_RATE_LIMITER'
    | 'HEALTH_RATE_LIMITER';
}

/**
 * Rate limit entry stored in KV
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Generate rate limit key for a client
 */
async function getRateLimitKey(ip: string, endpoint: string): Promise<string> {
  // Normalize endpoint to avoid key explosion
  const normalizedEndpoint = endpoint
    .split('?')[0]
    .replace(/\/+$/, '')
    .replace(/^\/api\/deletion\/[^/]+$/, '/api/deletion/:id');
  return `rl:${await sha256(ip)}:${normalizedEndpoint}`;
}

/**
 * Get rate limit entry from KV
 */
async function getRateLimitEntry(kv: KVNamespace, key: string): Promise<RateLimitEntry | null> {
  try {
    const value = await kv.get(key, 'json');
    return value as RateLimitEntry | null;
  } catch {
    return null;
  }
}

/**
 * Set rate limit entry in KV with TTL
 */
async function setRateLimitEntry(
  kv: KVNamespace,
  key: string,
  entry: RateLimitEntry,
  ttlSeconds: number
): Promise<void> {
  try {
    await kv.put(key, JSON.stringify(entry), { expirationTtl: ttlSeconds });
  } catch (err) {
    console.error('Failed to set rate limit entry:', err);
  }
}

/**
 * Production uses Cloudflare's native atomic limiter and fails closed when a
 * binding is unavailable. KV remains a best-effort local/test fallback only.
 */
export function rateLimit(config: RateLimitConfig) {
  const { limit, windowSeconds, binding } = config;
  const windowMs = windowSeconds * 1000;

  return async (c: Context<{ Bindings: Env }>, next: Next): Promise<Response> => {
    const ip = getClientIP(c);
    const endpoint = c.req.path;
    const key = await getRateLimitKey(ip, endpoint);
    const nativeLimiter = c.env[binding];

    if (nativeLimiter) {
      try {
        const outcome = await nativeLimiter.limit({ key });
        c.header('X-RateLimit-Limit', limit.toString());

        if (!outcome.success) {
          c.header('Retry-After', windowSeconds.toString());
          return c.json(
            {
              success: false,
              error: 'Rate limit exceeded',
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please try again later.',
              retry_after: windowSeconds,
            },
            429
          );
        }

        await next();
        return c.res;
      } catch (error) {
        console.error(`[rate-limit] ${binding} failed`, error);
        if (c.env.ENVIRONMENT === 'production') {
          return c.json(
            {
              success: false,
              error: 'Service temporarily unavailable',
              code: 'RATE_LIMIT_UNAVAILABLE',
            },
            503
          );
        }
      }
    }

    if (c.env.ENVIRONMENT === 'production') {
      console.error(`[rate-limit] missing production binding ${binding}`);
      return c.json(
        {
          success: false,
          error: 'Service temporarily unavailable',
          code: 'RATE_LIMIT_UNAVAILABLE',
        },
        503
      );
    }

    const kv = c.env.RATE_LIMIT_KV;
    if (!kv) {
      console.warn(`[rate-limit] ${binding} unavailable outside production; allowing request`);
      await next();
      return c.res;
    }

    const now = Date.now();
    let entry = await getRateLimitEntry(kv, key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 1, resetAt: now + windowMs };
    } else {
      entry.count++;
    }

    const remaining = Math.max(0, limit - entry.count);
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);
    c.header('X-RateLimit-Limit', limit.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000).toString());

    if (entry.count > limit) {
      c.header('Retry-After', resetSeconds.toString());
      await setRateLimitEntry(kv, key, entry, windowSeconds + 60);
      return c.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Please wait ${resetSeconds} seconds before trying again.`,
          retry_after: resetSeconds,
        },
        429
      );
    }

    await setRateLimitEntry(kv, key, entry, windowSeconds + 60);
    await next();
    return c.res;
  };
}

/**
 * Pre-configured rate limiters for different endpoints
 *
 * Rate limits (per IP, per endpoint):
 * - /api/analyze: 10 req/min (fingerprint submission)
 * - /api/stats/*: 60 req/min (statistics queries)
 * - /api/health: 120 req/min (health checks)
 * - /api/deletion: 5 req/min (GDPR deletion requests)
 */
export const analyzeLimiter = rateLimit({
  limit: 10, // 10 requests per minute for fingerprint submission
  windowSeconds: 60,
  binding: 'ANALYZE_RATE_LIMITER',
});

export const statsLimiter = rateLimit({
  limit: 60, // 60 requests per minute for stats queries
  windowSeconds: 60,
  binding: 'STATS_RATE_LIMITER',
});

export const healthLimiter = rateLimit({
  limit: 120, // 120 requests per minute (health checks can be frequent)
  windowSeconds: 60,
  binding: 'HEALTH_RATE_LIMITER',
});

export const deletionLimiter = rateLimit({
  limit: 5,
  windowSeconds: 60,
  binding: 'DELETION_RATE_LIMITER',
});
