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
import ipIntel from './routes/ip-intel.js';
import { handleScheduled } from './scheduled.js';

type AppEnv = {
  Bindings: Env;
  Variables: {
    requestId: string;
  };
};

// Create main app
const app = new Hono<AppEnv>();

function printRequestLog(message: string): void {
  const parts = message.split(' ');
  const pathIndex = 2;
  const rawPath = parts[pathIndex] || '/';
  const pathname = rawPath.split('?', 1)[0];
  parts[pathIndex] = pathname.startsWith('/api/ip-intel') ? '/api/ip-intel' : pathname;
  console.log(parts.join(' '));
}

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
app.use('*', logger(printRequestLog));
app.use('*', secureHeaders());

// CORS configuration
app.use(
  '/api/*',
  cors({
    origin: (origin, c) => {
      if (!origin) return null;

      try {
        const url = new URL(origin);
        const productionOrigins = new Set([
          'https://amiunique.io',
          'https://www.amiunique.io',
          'https://amiunique.pages.dev',
          'https://amiunique-api.7and1.workers.dev',
        ]);

        if (productionOrigins.has(url.origin)) return url.origin;
        if (url.protocol === 'https:' && url.hostname.endsWith('.amiunique.pages.dev')) {
          return url.origin;
        }
        if (
          c.env.ENVIRONMENT !== 'production' &&
          (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
          (url.protocol === 'http:' || url.protocol === 'https:')
        ) {
          return url.origin;
        }
      } catch {
        return null;
      }

      return null;
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Idempotency-Key'],
    exposeHeaders: ['X-Request-Id', 'Server-Timing'],
    maxAge: 86400,
  })
);

// Mount routes
app.route('/api/analyze', analyze);
app.route('/api/stats', stats);
app.route('/api/health', health);
app.route('/api/deletion', deletion);
app.route('/api/ip-intel', ipIntel);

// Root endpoint
app.get('/', c => {
  return c.json({
    name: 'AmiUnique.io API',
    version: '1.0.0',
    description: 'Browser fingerprinting detection API with 80+ dimensions',
    endpoints: {
      analyze: 'POST /api/analyze',
      deletion: 'POST /api/deletion',
      ip_intel: 'GET /api/ip-intel',
      stats: 'GET /api/stats',
      health: 'GET /api/health',
    },
    documentation: 'https://amiunique.io/developers/api-docs',
  });
});

// 404 handler
app.notFound(c => {
  return c.json(
    {
      success: false,
      error: 'Not Found',
      message: 'Route not found',
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
