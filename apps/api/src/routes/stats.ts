/**
 * GET /api/stats - Statistics endpoints
 * Provides global statistics and distribution data
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Env } from '../types/env.js';
import { statsLimiter } from '../middleware/rate-limit.js';

const stats = new Hono<{ Bindings: Env }>();

// Apply rate limiting to all stats routes
stats.use('*', statsLimiter);

/**
 * Set cache control headers with edge caching support
 * - max-age: Browser cache duration (half of CDN)
 * - s-maxage: CDN/Edge cache duration
 * - stale-while-revalidate: Serve stale while fetching fresh
 * - stale-if-error: Serve stale if origin errors
 */
function setCache(c: Context<{ Bindings: Env }>, seconds = 30) {
  const browserCache = Math.floor(seconds / 2);
  c.header(
    'Cache-Control',
    `public, max-age=${browserCache}, s-maxage=${seconds}, stale-while-revalidate=60, stale-if-error=300`
  );
  // Cloudflare-specific directive for longer edge caching
  c.header('CDN-Cache-Control', `max-age=${seconds}`);
}

/**
 * Validate and bound limit parameter (1-100)
 */
function parseLimit(value: string | undefined, defaultVal = 10): number {
  const parsed = parseInt(value || String(defaultVal));
  return Math.min(Math.max(isNaN(parsed) ? defaultVal : parsed, 1), 100);
}

/**
 * Validate and bound days parameter (1-365)
 */
function parseDays(value: string | undefined, defaultVal = 30): number {
  const parsed = parseInt(value || String(defaultVal));
  return Math.min(Math.max(isNaN(parsed) ? defaultVal : parsed, 1), 365);
}

/**
 * GET /api/stats - Global statistics
 * Uses pre-aggregated cache with fallback to live query
 */
stats.get('/', async (c) => {
  const db = c.env.DB;

  try {
    // First try to get from cache (fast path)
    const cached = await db
      .prepare('SELECT * FROM stats_cache WHERE id = ?')
      .bind('global')
      .first<{
        total_fingerprints: number;
        unique_full_hash: number;
        unique_hardware_hash: number;
        updated_at: number;
      }>();

    // If cache exists and is fresh (< 5 minutes old), use it
    const cacheAge = cached ? Date.now() - cached.updated_at : Infinity;
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    if (cached && cacheAge < CACHE_TTL_MS) {
      // Set longer edge cache for cached responses
      c.header('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      c.header('X-Cache-Source', 'pre-aggregated');

      return c.json({
        success: true,
        data: {
          total_fingerprints: cached.total_fingerprints,
          unique_sessions: cached.unique_full_hash,
          unique_devices: cached.unique_hardware_hash,
          updated_at: cached.updated_at,
        },
      });
    }

    // Cache miss or stale - compute live (slow path)
    const [total, uniqueFull, uniqueHardware] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM visits').first<{ count: number }>(),
      db.prepare('SELECT COUNT(DISTINCT full_hash) as count FROM visits').first<{ count: number }>(),
      db.prepare('SELECT COUNT(DISTINCT hardware_hash) as count FROM visits').first<{ count: number }>(),
    ]);

    const now = Date.now();
    const statsData = {
      total_fingerprints: total?.count || 0,
      unique_sessions: uniqueFull?.count || 0,
      unique_devices: uniqueHardware?.count || 0,
      updated_at: now,
    };

    // Update cache asynchronously (don't block response)
    const cacheWritePromise = db
      .prepare(
        `INSERT OR REPLACE INTO stats_cache (id, total_fingerprints, unique_full_hash, unique_hardware_hash, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind('global', statsData.total_fingerprints, statsData.unique_sessions, statsData.unique_devices, now)
      .run();

    // In tests or non-Worker environments executionCtx is absent; fall back to a best-effort write
    try {
      c.executionCtx.waitUntil(cacheWritePromise);
    } catch {
      cacheWritePromise.catch(err => console.error('Failed to update stats cache', err));
    }

    setCache(c, 30);
    c.header('X-Cache-Source', 'live-query');

    return c.json({
      success: true,
      data: statsData,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch statistics',
      },
      500
    );
  }
});

/**
 * GET /api/stats/browsers - Browser distribution
 */
stats.get('/browsers', async (c) => {
  const db = c.env.DB;
  const limit = parseLimit(c.req.query('limit'), 10);

  try {
    const result = await db
      .prepare(
        `SELECT meta_browser as browser, COUNT(*) as count
         FROM visits
         WHERE meta_browser IS NOT NULL
         GROUP BY meta_browser
         ORDER BY count DESC
         LIMIT ?`
      )
      .bind(limit)
      .all<{ browser: string; count: number }>();

    const total = result.results?.reduce((sum, r) => sum + r.count, 0) || 0;
    const distribution = result.results?.map(r => ({
      name: r.browser,
      count: r.count,
      percentage: total > 0 ? ((r.count / total) * 100).toFixed(1) : '0',
    }));

    setCache(c, 60);
    return c.json({
      success: true,
      data: {
        distribution,
        total,
        updated_at: Date.now(),
      },
    });
  } catch (error) {
    console.error('Browser stats error:', error);
    return c.json({ success: false, error: 'Failed to fetch browser stats' }, 500);
  }
});

/**
 * GET /api/stats/os - Operating system distribution
 */
stats.get('/os', async (c) => {
  const db = c.env.DB;
  const limit = parseLimit(c.req.query('limit'), 10);

  try {
    const result = await db
      .prepare(
        `SELECT meta_os as os, COUNT(*) as count
         FROM visits
         WHERE meta_os IS NOT NULL
         GROUP BY meta_os
         ORDER BY count DESC
         LIMIT ?`
      )
      .bind(limit)
      .all<{ os: string; count: number }>();

    const total = result.results?.reduce((sum, r) => sum + r.count, 0) || 0;
    const distribution = result.results?.map(r => ({
      name: r.os,
      count: r.count,
      percentage: total > 0 ? ((r.count / total) * 100).toFixed(1) : '0',
    }));

    setCache(c, 60);
    return c.json({
      success: true,
      data: {
        distribution,
        total,
        updated_at: Date.now(),
      },
    });
  } catch (error) {
    console.error('OS stats error:', error);
    return c.json({ success: false, error: 'Failed to fetch OS stats' }, 500);
  }
});

/**
 * GET /api/stats/devices - Device type distribution
 */
stats.get('/devices', async (c) => {
  const db = c.env.DB;

  try {
    const result = await db
      .prepare(
        `SELECT meta_device_type as device, COUNT(*) as count
         FROM visits
         WHERE meta_device_type IS NOT NULL
         GROUP BY meta_device_type
         ORDER BY count DESC`
      )
      .all<{ device: string; count: number }>();

    const total = result.results?.reduce((sum, r) => sum + r.count, 0) || 0;
    const distribution = result.results?.map(r => ({
      name: r.device,
      count: r.count,
      percentage: total > 0 ? ((r.count / total) * 100).toFixed(1) : '0',
    }));

    setCache(c, 60);
    return c.json({
      success: true,
      data: {
        distribution,
        total,
        updated_at: Date.now(),
      },
    });
  } catch (error) {
    console.error('Device stats error:', error);
    return c.json({ success: false, error: 'Failed to fetch device stats' }, 500);
  }
});

/**
 * GET /api/stats/countries - Geographic distribution
 */
stats.get('/countries', async (c) => {
  const db = c.env.DB;
  const limit = parseLimit(c.req.query('limit'), 20);

  try {
    const result = await db
      .prepare(
        `SELECT meta_country as country, COUNT(*) as count
         FROM visits
         WHERE meta_country IS NOT NULL
         GROUP BY meta_country
         ORDER BY count DESC
         LIMIT ?`
      )
      .bind(limit)
      .all<{ country: string; count: number }>();

    const total = result.results?.reduce((sum, r) => sum + r.count, 0) || 0;
    const distribution = result.results?.map(r => ({
      code: r.country,
      count: r.count,
      percentage: total > 0 ? ((r.count / total) * 100).toFixed(1) : '0',
    }));

    setCache(c, 60);
    return c.json({
      success: true,
      data: {
        distribution,
        total,
        updated_at: Date.now(),
      },
    });
  } catch (error) {
    console.error('Country stats error:', error);
    return c.json({ success: false, error: 'Failed to fetch country stats' }, 500);
  }
});

/**
 * GET /api/stats/screens - Screen resolution distribution
 */
stats.get('/screens', async (c) => {
  const db = c.env.DB;
  const limit = parseLimit(c.req.query('limit'), 15);

  try {
    const result = await db
      .prepare(
        `SELECT meta_screen as screen, COUNT(*) as count
         FROM visits
         WHERE meta_screen IS NOT NULL AND meta_screen != '0x0'
         GROUP BY meta_screen
         ORDER BY count DESC
         LIMIT ?`
      )
      .bind(limit)
      .all<{ screen: string; count: number }>();

    const total = result.results?.reduce((sum, r) => sum + r.count, 0) || 0;
    const distribution = result.results?.map(r => ({
      resolution: r.screen,
      count: r.count,
      percentage: total > 0 ? ((r.count / total) * 100).toFixed(1) : '0',
    }));

    setCache(c, 60);
    return c.json({
      success: true,
      data: {
        distribution,
        total,
        updated_at: Date.now(),
      },
    });
  } catch (error) {
    console.error('Screen stats error:', error);
    return c.json({ success: false, error: 'Failed to fetch screen stats' }, 500);
  }
});

/**
 * GET /api/stats/gpus - GPU vendor distribution
 */
stats.get('/gpus', async (c) => {
  const db = c.env.DB;
  const limit = parseLimit(c.req.query('limit'), 10);

  try {
    const result = await db
      .prepare(
        `SELECT meta_gpu_vendor as gpu, COUNT(*) as count
         FROM visits
         WHERE meta_gpu_vendor IS NOT NULL AND meta_gpu_vendor != ''
         GROUP BY meta_gpu_vendor
         ORDER BY count DESC
         LIMIT ?`
      )
      .bind(limit)
      .all<{ gpu: string; count: number }>();

    const total = result.results?.reduce((sum, r) => sum + r.count, 0) || 0;
    const distribution = result.results?.map(r => ({
      vendor: r.gpu,
      count: r.count,
      percentage: total > 0 ? ((r.count / total) * 100).toFixed(1) : '0',
    }));

    setCache(c, 60);
    return c.json({
      success: true,
      data: {
        distribution,
        total,
        updated_at: Date.now(),
      },
    });
  } catch (error) {
    console.error('GPU stats error:', error);
    return c.json({ success: false, error: 'Failed to fetch GPU stats' }, 500);
  }
});

/**
 * GET /api/stats/daily - Daily trends
 */
stats.get('/daily', async (c) => {
  const db = c.env.DB;
  const days = parseDays(c.req.query('days'), 30);

  try {
    // Calculate timestamp for N days ago
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const result = await db
      .prepare(
        `SELECT
           date(created_at / 1000, 'unixepoch') as date,
           COUNT(*) as total_visits,
           COUNT(DISTINCT hardware_hash) as unique_devices
         FROM visits
         WHERE created_at >= ?
         GROUP BY date(created_at / 1000, 'unixepoch')
         ORDER BY date ASC`
      )
      .bind(startTime)
      .all<{ date: string; total_visits: number; unique_devices: number }>();

    setCache(c, 30);
    return c.json({
      success: true,
      data: {
        trends: result.results || [],
        period_days: days,
        updated_at: Date.now(),
      },
    });
  } catch (error) {
    console.error('Daily stats error:', error);
    return c.json({ success: false, error: 'Failed to fetch daily stats' }, 500);
  }
});

export default stats;
