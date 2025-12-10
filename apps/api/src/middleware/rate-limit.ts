/**
 * Rate limiting middleware for API protection
 * Uses Cloudflare KV for distributed rate limiting across all edge locations
 */

import { Context, Next } from 'hono';
import type { Env } from '../types/env.js';

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

/**
 * Rate limit entry stored in KV
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Get client IP from request
 */
function getClientIP(c: Context<{ Bindings: Env }>): string {
  return (
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

/**
 * Generate rate limit key for a client
 */
function getRateLimitKey(ip: string, endpoint: string): string {
  // Normalize endpoint to avoid key explosion
  const normalizedEndpoint = endpoint.split('?')[0].replace(/\/+$/, '');
  return `rl:${ip}:${normalizedEndpoint}`;
}

/**
 * Get rate limit entry from KV
 */
async function getRateLimitEntry(
  kv: KVNamespace,
  key: string
): Promise<RateLimitEntry | null> {
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
 * Rate limiter middleware factory
 * Uses Cloudflare KV for distributed rate limiting
 */
export function rateLimit(config: RateLimitConfig) {
  const { limit, windowSeconds } = config;
  const windowMs = windowSeconds * 1000;

  return async (c: Context<{ Bindings: Env }>, next: Next): Promise<Response> => {
    const kv = c.env.RATE_LIMIT_KV;

    // Fallback to in-memory if KV is not available (local dev)
    if (!kv) {
      console.warn('Rate limit KV not available, skipping rate limiting');
      await next();
      return c.res;
    }

    const ip = getClientIP(c);
    const endpoint = c.req.path;
    const key = getRateLimitKey(ip, endpoint);
    const now = Date.now();

    // Get current rate limit entry
    let entry = await getRateLimitEntry(kv, key);

    if (!entry || now > entry.resetAt) {
      // New window - create fresh entry
      entry = { count: 1, resetAt: now + windowMs };
    } else {
      // Existing window - increment count
      entry.count++;
    }

    // Calculate remaining requests and reset time
    const remaining = Math.max(0, limit - entry.count);
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', limit.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000).toString());

    // Helper to call waitUntil if available (not in tests)
    const waitUntilSafe = (promise: Promise<void>) => {
      try {
        c.executionCtx?.waitUntil?.(promise);
      } catch {
        // In test environment, executionCtx may not be available - ignore
      }
    };

    // Check if over limit BEFORE updating KV
    if (entry.count > limit) {
      c.header('Retry-After', resetSeconds.toString());

      // Still update KV to track abuse attempts
      waitUntilSafe(setRateLimitEntry(kv, key, entry, windowSeconds + 60));

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

    // Update KV entry asynchronously (non-blocking)
    waitUntilSafe(setRateLimitEntry(kv, key, entry, windowSeconds + 60));

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
 * - /api/deletion: 5 req/5min (GDPR deletion requests)
 */
export const analyzeLimiter = rateLimit({
  limit: 10, // 10 requests per minute for fingerprint submission
  windowSeconds: 60,
});

export const statsLimiter = rateLimit({
  limit: 60, // 60 requests per minute for stats queries
  windowSeconds: 60,
});

export const healthLimiter = rateLimit({
  limit: 120, // 120 requests per minute (health checks can be frequent)
  windowSeconds: 60,
});

export const deletionLimiter = rateLimit({
  limit: 5, // 5 requests per 5 minutes (protect opt-out endpoint)
  windowSeconds: 300,
});
