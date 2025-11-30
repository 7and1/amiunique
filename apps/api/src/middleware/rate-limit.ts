/**
 * Rate limiting middleware for API protection
 * Uses in-memory storage with Cloudflare's edge runtime
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
 * In-memory rate limit store
 * Note: In Cloudflare Workers, this is per-isolate, so it's best-effort
 * For production at scale, use Cloudflare's Rate Limiting or KV
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Clean up expired entries periodically
 */
function cleanupExpired(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key);
    }
  }
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
  return `${ip}:${endpoint}`;
}

/**
 * Rate limiter middleware factory
 */
export function rateLimit(config: RateLimitConfig) {
  const { limit, windowSeconds } = config;
  const windowMs = windowSeconds * 1000;

  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    // Cleanup every 100 requests (probabilistic cleanup)
    if (Math.random() < 0.01) {
      cleanupExpired();
    }

    const ip = getClientIP(c);
    const endpoint = c.req.path;
    const key = getRateLimitKey(ip, endpoint);
    const now = Date.now();

    // Get or initialize rate limit entry
    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
      // New window
      entry = { count: 1, resetAt: now + windowMs };
      rateLimitStore.set(key, entry);
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

    // Check if over limit
    if (entry.count > limit) {
      c.header('Retry-After', resetSeconds.toString());
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

    await next();
  };
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const analyzeLimiter = rateLimit({
  limit: 10, // 10 requests
  windowSeconds: 60, // per minute
});

export const statsLimiter = rateLimit({
  limit: 60, // 60 requests
  windowSeconds: 60, // per minute
});

export const healthLimiter = rateLimit({
  limit: 120, // 120 requests
  windowSeconds: 60, // per minute (health checks can be frequent)
});
