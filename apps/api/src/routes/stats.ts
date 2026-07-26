/**
 * GET /api/stats - Statistics endpoints
 *
 * Distribution routes read the pre-aggregated JSON written by the five-minute
 * cron (src/scheduled.ts) and fall back to a live aggregation when it is
 * missing or stale, refreshing the cache in the background.
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Env } from '../types/env.js';
import { statsLimiter } from '../middleware/rate-limit.js';
import {
  computeDistribution,
  distributionUpsert,
  isFresh,
  readStatsCacheRow,
  readStoredDistribution,
  toView,
  type DistributionKey,
  type DistributionView,
  type StatsCacheRow,
  type StoredDistribution,
} from '../lib/stats-aggregation.js';

const stats = new Hono<{ Bindings: Env }>();

// Apply rate limiting to all stats routes
stats.use('*', statsLimiter);

/** Scalar counter freshness for GET /api/stats */
const SCALAR_CACHE_TTL_MS = 5 * 60 * 1000;
/** Distribution freshness; the writer runs every 5 minutes */
const DISTRIBUTION_CACHE_TTL_MS = 10 * 60 * 1000;

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
 * Run a promise past the response when the Worker runtime allows it.
 * Tests and non-Worker environments have no executionCtx.
 */
function background(c: Context<{ Bindings: Env }>, work: Promise<unknown>, label: string): void {
  try {
    c.executionCtx.waitUntil(work);
  } catch {
    work.catch(err => console.error(label, err));
  }
}

/**
 * Resolve one distribution: pre-aggregated when fresh, otherwise a live
 * aggregation that also refreshes the cache in the background.
 */
async function resolveDistribution(
  c: Context<{ Bindings: Env }>,
  key: DistributionKey,
  cacheRow: StatsCacheRow | null
): Promise<{ stored: StoredDistribution; source: 'pre-aggregated' | 'live-query' }> {
  const cached = readStoredDistribution(cacheRow, key);
  if (cached && isFresh(cached, DISTRIBUTION_CACHE_TTL_MS)) {
    return { stored: cached, source: 'pre-aggregated' };
  }

  const db = c.env.DB;
  const stored = await computeDistribution(db, key);
  background(c, distributionUpsert(db, key, stored).run(), `Failed to cache ${key} distribution`);

  return { stored, source: 'live-query' };
}

/**
 * Distribution routes historically used different bucket key names. They are
 * preserved so existing clients keep working; /summary normalizes to `name`.
 */
type BucketKeyName = 'name' | 'code' | 'resolution' | 'vendor';

function toLegacyDistribution(
  view: DistributionView,
  bucketKey: BucketKeyName
): Record<string, unknown>[] {
  return view.buckets.map(bucket => ({
    [bucketKey]: bucket.name,
    count: bucket.count,
    percentage: bucket.percentage,
  }));
}

/**
 * Shared handler for the six distribution routes.
 */
function distributionRoute(
  key: DistributionKey,
  bucketKey: BucketKeyName,
  defaultLimit: number,
  errorMessage: string
) {
  return async (c: Context<{ Bindings: Env }>) => {
    const limit = parseLimit(c.req.query('limit'), defaultLimit);

    try {
      const cacheRow = await readStatsCacheRow(c.env.DB).catch(() => null);
      const { stored, source } = await resolveDistribution(c, key, cacheRow);
      const view = toView(stored, limit);

      setCache(c, 60);
      c.header('X-Cache-Source', source);

      return c.json({
        success: true,
        data: {
          distribution: toLegacyDistribution(view, bucketKey),
          other: view.other,
          total: view.total,
          updated_at: view.updated_at,
        },
      });
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      return c.json({ success: false, error: errorMessage }, 500);
    }
  };
}

/**
 * Read the daily trend from daily_stats, falling back to a live GROUP BY when
 * the pre-aggregated table has no rows for the window yet.
 */
async function resolveDailyTrends(
  db: D1Database,
  days: number
): Promise<{
  trends: { date: string; total_visits: number; unique_devices: number }[];
  source: 'pre-aggregated' | 'live-query';
}> {
  const startTime = Date.now() - days * 24 * 60 * 60 * 1000;
  const startDate = new Date(startTime).toISOString().slice(0, 10);

  const preAggregated = await db
    .prepare(
      `SELECT date, total_visits, unique_visitors as unique_devices
       FROM daily_stats
       WHERE date >= ?
       ORDER BY date ASC`
    )
    .bind(startDate)
    .all<{ date: string; total_visits: number; unique_devices: number }>();

  if (preAggregated.results && preAggregated.results.length > 0) {
    return { trends: preAggregated.results, source: 'pre-aggregated' };
  }

  const live = await db
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

  return { trends: live.results || [], source: 'live-query' };
}

async function computeScalarTotals(db: D1Database): Promise<{
  total_fingerprints: number;
  unique_sessions: number;
  unique_devices: number;
}> {
  const [total, uniqueFull, uniqueHardware] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM visits').first<{ count: number }>(),
    db.prepare('SELECT COUNT(DISTINCT full_hash) as count FROM visits').first<{ count: number }>(),
    db
      .prepare('SELECT COUNT(DISTINCT hardware_hash) as count FROM visits')
      .first<{ count: number }>(),
  ]);

  return {
    total_fingerprints: total?.count || 0,
    unique_sessions: uniqueFull?.count || 0,
    unique_devices: uniqueHardware?.count || 0,
  };
}

/**
 * GET /api/stats - Global statistics
 * Uses pre-aggregated cache with fallback to live query
 */
stats.get('/', async c => {
  const db = c.env.DB;

  try {
    // First try to get from cache (fast path)
    const cached = await readStatsCacheRow(db);

    // If cache exists and is fresh (< 5 minutes old), use it
    const cacheAge = cached ? Date.now() - cached.updated_at : Infinity;

    if (cached && cacheAge < SCALAR_CACHE_TTL_MS) {
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
    const totals = await computeScalarTotals(db);
    const now = Date.now();
    const statsData = { ...totals, updated_at: now };

    // Update cache asynchronously (don't block response). Only the scalar
    // counters are touched so the cron's distribution columns survive.
    background(
      c,
      db
        .prepare(
          `INSERT INTO stats_cache (id, updated_at, total_fingerprints, unique_full_hash, unique_hardware_hash)
           VALUES ('global', ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             updated_at = excluded.updated_at,
             total_fingerprints = excluded.total_fingerprints,
             unique_full_hash = excluded.unique_full_hash,
             unique_hardware_hash = excluded.unique_hardware_hash`
        )
        .bind(now, totals.total_fingerprints, totals.unique_sessions, totals.unique_devices)
        .run(),
      'Failed to update stats cache'
    );

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
 * GET /api/stats/summary - Everything a dashboard needs in one round trip
 */
stats.get('/summary', async c => {
  const db = c.env.DB;
  const limit = parseLimit(c.req.query('limit'), 10);
  const days = parseDays(c.req.query('days'), 30);

  try {
    const cacheRow = await readStatsCacheRow(db).catch(() => null);

    const [browser, os, device, country, screen, gpu] = await Promise.all([
      resolveDistribution(c, 'browser', cacheRow),
      resolveDistribution(c, 'os', cacheRow),
      resolveDistribution(c, 'device', cacheRow),
      resolveDistribution(c, 'country', cacheRow),
      resolveDistribution(c, 'screen', cacheRow),
      resolveDistribution(c, 'gpu', cacheRow),
    ]);
    const daily = await resolveDailyTrends(db, days);

    const scalarsFresh = Boolean(
      cacheRow && Date.now() - cacheRow.updated_at < SCALAR_CACHE_TTL_MS
    );
    const totals = scalarsFresh
      ? {
          total_fingerprints: cacheRow!.total_fingerprints,
          unique_sessions: cacheRow!.unique_full_hash,
          unique_devices: cacheRow!.unique_hardware_hash,
        }
      : await computeScalarTotals(db);

    const distributionParts = [browser, os, device, country, screen, gpu];
    const allPreAggregated =
      scalarsFresh &&
      daily.source === 'pre-aggregated' &&
      distributionParts.every(part => part.source === 'pre-aggregated');

    setCache(c, 60);
    c.header('X-Cache-Source', allPreAggregated ? 'pre-aggregated' : 'live-query');

    return c.json({
      success: true,
      data: {
        totals,
        distributions: {
          browsers: toView(browser.stored, limit),
          os: toView(os.stored, limit),
          devices: toView(device.stored, limit),
          countries: toView(country.stored, limit),
          screens: toView(screen.stored, limit),
          gpus: toView(gpu.stored, limit),
        },
        daily: {
          trends: daily.trends,
          period_days: days,
        },
        updated_at: Date.now(),
        source: allPreAggregated ? 'pre-aggregated' : 'live',
      },
    });
  } catch (error) {
    console.error('Stats summary error:', error);
    return c.json({ success: false, error: 'Failed to fetch statistics summary' }, 500);
  }
});

/**
 * GET /api/stats/browsers - Browser distribution
 */
stats.get('/browsers', distributionRoute('browser', 'name', 10, 'Failed to fetch browser stats'));

/**
 * GET /api/stats/os - Operating system distribution
 */
stats.get('/os', distributionRoute('os', 'name', 10, 'Failed to fetch OS stats'));

/**
 * GET /api/stats/devices - Device type distribution
 */
stats.get('/devices', distributionRoute('device', 'name', 10, 'Failed to fetch device stats'));

/**
 * GET /api/stats/countries - Geographic distribution
 */
stats.get('/countries', distributionRoute('country', 'code', 20, 'Failed to fetch country stats'));

/**
 * GET /api/stats/screens - Screen resolution distribution
 */
stats.get('/screens', distributionRoute('screen', 'resolution', 15, 'Failed to fetch screen stats'));

/**
 * GET /api/stats/gpus - GPU vendor distribution
 */
stats.get('/gpus', distributionRoute('gpu', 'vendor', 10, 'Failed to fetch GPU stats'));

/**
 * GET /api/stats/daily - Daily trends
 */
stats.get('/daily', async c => {
  const db = c.env.DB;
  const days = parseDays(c.req.query('days'), 30);

  try {
    const { trends, source } = await resolveDailyTrends(db, days);

    setCache(c, 30);
    c.header('X-Cache-Source', source);

    return c.json({
      success: true,
      data: {
        trends,
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
