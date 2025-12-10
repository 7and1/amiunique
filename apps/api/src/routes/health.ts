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
health.get('/', async (c) => {
  const startTime = Date.now();

  try {
    // Test D1 connection
    const dbStart = Date.now();
    const dbCheck = await c.env.DB.prepare('SELECT 1 as ok').first<{ ok: number }>();
    const dbLatency = Date.now() - dbStart;
    const dbOk = dbCheck?.ok === 1;

    return c.json({
      status: dbOk ? 'healthy' : 'degraded',
      timestamp: Date.now(),
      latency_ms: Date.now() - startTime,
      environment: c.env.ENVIRONMENT || 'unknown',
      checks: {
        database: dbOk ? 'ok' : 'error',
        db_latency_ms: dbLatency,
      },
    });
  } catch (error) {
    return c.json(
      {
        status: 'unhealthy',
        timestamp: Date.now(),
        latency_ms: Date.now() - startTime,
        environment: c.env.ENVIRONMENT || 'unknown',
        checks: {
          database: 'error',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      503
    );
  }
});

/**
 * GET /api/health/ready - Readiness probe
 */
health.get('/ready', async (c) => {
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
health.get('/live', (c) => {
  return c.json({ alive: true });
});

export default health;
