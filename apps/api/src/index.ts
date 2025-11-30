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

// Create main app
const app = new Hono<{ Bindings: Env }>();

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

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'AmiUnique.io API',
    version: '1.0.0',
    description: 'Browser fingerprinting detection API with 80+ dimensions',
    endpoints: {
      analyze: 'POST /api/analyze',
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
  console.error('Unhandled error:', err);
  return c.json(
    {
      success: false,
      error: 'Internal Server Error',
      message: c.env.ENVIRONMENT === 'development' ? err.message : 'An unexpected error occurred',
    },
    500
  );
});

export default app;
