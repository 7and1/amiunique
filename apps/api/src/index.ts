/**
 * AmiUnique.io API Worker
 * Main entry point for Cloudflare Worker
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { timing } from 'hono/timing';
import { secureHeaders } from 'hono/secure-headers';

import type { Env } from './types/env.js';
import analyze from './routes/analyze.js';
import stats from './routes/stats.js';
import health from './routes/health.js';
import deletion from './routes/deletion.js';
import { handleScheduled } from './scheduled.js';

// Create main app
const app = new Hono<{ Bindings: Env }>();

// Request ID middleware - adds unique request ID for tracing
app.use('*', async (c, next) => {
  // Use Cloudflare Ray ID if available, otherwise generate UUID
  const requestId = c.req.header('cf-ray') || crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-Id', requestId);
  await next();
});

// Global middleware
app.use('*', timing());
app.use('*', logger());
app.use('*', secureHeaders());

// CORS configuration
app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      // Allow localhost for development
      if (!origin || origin.startsWith('http://localhost')) return origin;
      // Allow Cloudflare Pages preview URLs
      if (origin.endsWith('.pages.dev')) return origin;
      // Allow workers.dev URLs
      if (origin.endsWith('.workers.dev')) return origin;
      // Allow production domains
      if (origin === 'https://amiunique.io' || origin === 'https://www.amiunique.io') return origin;
      return null;
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['X-Request-Id', 'Server-Timing'],
    maxAge: 86400,
  })
);

// Mount routes
app.route('/api/analyze', analyze);
app.route('/api/stats', stats);
app.route('/api/health', health);
app.route('/api/deletion', deletion);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'AmiUnique.io API',
    version: '1.0.0',
    description: 'Browser fingerprinting detection API with 80+ dimensions',
    endpoints: {
      analyze: 'POST /api/analyze',
      deletion: 'POST /api/deletion',
      stats: 'GET /api/stats',
      health: 'GET /api/health',
    },
    documentation: 'https://amiunique.io/developers/api-docs',
  });
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Not Found',
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  const requestId = c.get('requestId') || 'unknown';
  console.error(`[${requestId}] Unhandled error:`, err);
  return c.json(
    {
      success: false,
      error: 'Internal Server Error',
      message: c.env.ENVIRONMENT === 'development' ? err.message : 'An unexpected error occurred',
      request_id: requestId,
    },
    500
  );
});

// Export with scheduled handler for cron triggers
export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
};
