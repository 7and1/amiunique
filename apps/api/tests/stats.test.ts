import { describe, it, expect } from 'vitest';
import stats from '../src/routes/stats.js';
import health from '../src/routes/health.js';
import type { Env } from '../src/types/env.js';
import type { StoredDistribution } from '../src/lib/stats-aggregation.js';

type MockRow = Record<string, unknown>;

type MockStatement = {
  bind: (..._args: unknown[]) => MockStatement;
  first: () => Promise<MockRow | null>;
  all: () => Promise<{ results: MockRow[] }>;
  run: () => Promise<{ success: boolean }>;
};

type MockDB = {
  prepare: (query: string) => MockStatement;
};

interface MockOptions {
  /** Row returned for the stats_cache read (null = cache miss) */
  cacheRow?: MockRow | null;
}

function createMockDB(options: MockOptions = {}): MockDB {
  const { cacheRow = null } = options;

  return {
    prepare(query: string): MockStatement {
      const stmt: MockStatement = {
        bind: () => stmt,
        async first() {
          if (query.includes('FROM stats_cache')) return cacheRow;
          if (query.includes('FROM deletion_requests')) {
            return { pending: 2, max_retry_count: 1, oldest_created_at: Date.now() - 60_000 };
          }
          // computeDistribution denominator: SELECT COUNT(*) as total FROM visits WHERE <col> ...
          if (query.includes('as total FROM visits')) return { total: 120 };
          if (query.includes('full_hash')) return { count: 3 };
          if (query.includes('hardware_hash')) return { count: 2 };
          if (query.includes('SELECT COUNT(*) as count FROM visits')) return { count: 10 };
          if (query.includes('SELECT 1 as ok')) return { ok: 1 };
          return { count: 0 };
        },
        async all() {
          // computeDistribution buckets: SELECT <col> as name, COUNT(*) as count ...
          if (query.includes('meta_browser')) {
            return {
              results: [
                { name: 'Chrome', count: 70 },
                { name: 'Firefox', count: 30 },
              ],
            };
          }
          if (query.includes('meta_os')) {
            return {
              results: [
                { name: 'Windows', count: 60 },
                { name: 'macOS', count: 40 },
              ],
            };
          }
          if (query.includes('meta_device_type')) {
            return {
              results: [
                { name: 'desktop', count: 80 },
                { name: 'mobile', count: 20 },
              ],
            };
          }
          if (query.includes('meta_country')) {
            return {
              results: [
                { name: 'US', count: 50 },
                { name: 'FR', count: 10 },
              ],
            };
          }
          if (query.includes('meta_screen')) {
            return {
              results: [
                { name: '1920x1080', count: 40 },
                { name: '1366x768', count: 20 },
              ],
            };
          }
          if (query.includes('meta_gpu_vendor')) {
            return {
              results: [
                { name: 'NVIDIA', count: 30 },
                { name: 'AMD', count: 10 },
              ],
            };
          }
          if (query.includes('FROM daily_stats')) {
            return {
              results: [
                { date: '2026-07-25', total_visits: 10, unique_devices: 8 },
                { date: '2026-07-26', total_visits: 12, unique_devices: 9 },
              ],
            };
          }
          if (query.includes('date(created_at')) {
            return {
              results: [
                { date: '2026-07-25', total_visits: 10, unique_devices: 8 },
                { date: '2026-07-26', total_visits: 12, unique_devices: 9 },
              ],
            };
          }
          return { results: [] };
        },
        async run() {
          return { success: true };
        },
      };
      return stmt;
    },
  };
}

function makeEnv(options: MockOptions = {}): Env {
  return {
    DB: createMockDB(options),
    ENVIRONMENT: 'test',
  } as unknown as Env;
}

function freshStoredDistribution(): StoredDistribution {
  return {
    v: 1,
    total: 200,
    buckets: [
      { name: 'Chrome', count: 120 },
      { name: 'Firefox', count: 50 },
    ],
    computed_at: Date.now(),
  };
}

describe('stats routes', () => {
  it('returns global stats with counts (live fallback)', async () => {
    const res = await stats.fetch(new Request('http://localhost/'), makeEnv() as never);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.total_fingerprints).toBe(10);
    expect(json.data.unique_sessions).toBe(3);
    expect(json.data.unique_devices).toBe(2);
  });

  it('computes honest percentages against the corpus total with an other bucket', async () => {
    // Buckets sum to 100 but the corpus has 120 rows with a browser value:
    // Chrome must be 70/120 = 58.3%, not 70%, and the missing 20 land in `other`.
    const res = await stats.fetch(new Request('http://localhost/browsers'), makeEnv() as never);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache-Source')).toBe('live-query');
    const json = (await res.json()) as any;
    expect(json.data.total).toBe(120);
    expect(json.data.distribution[0].name).toBe('Chrome');
    expect(json.data.distribution[0].percentage).toBe(58.3);
    expect(json.data.distribution[1].percentage).toBe(25);
    expect(json.data.other).toEqual({ count: 20, percentage: 16.7 });
  });

  it('serves a fresh pre-aggregated distribution without querying visits', async () => {
    const stored = freshStoredDistribution();
    const res = await stats.fetch(
      new Request('http://localhost/browsers?limit=1'),
      makeEnv({
        cacheRow: {
          total_fingerprints: 200,
          unique_full_hash: 150,
          unique_hardware_hash: 140,
          updated_at: Date.now(),
          browser_distribution: JSON.stringify(stored),
        },
      }) as never
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache-Source')).toBe('pre-aggregated');
    const json = (await res.json()) as any;
    expect(json.data.distribution).toHaveLength(1);
    expect(json.data.distribution[0]).toEqual({ name: 'Chrome', count: 120, percentage: 60 });
    // limit=1 leaves Firefox (50) plus the untracked tail (30) in `other`
    expect(json.data.other).toEqual({ count: 80, percentage: 40 });
  });

  it('falls back to a live query when the cached distribution is stale', async () => {
    const stale: StoredDistribution = {
      ...freshStoredDistribution(),
      computed_at: Date.now() - 11 * 60 * 1000,
    };
    const res = await stats.fetch(
      new Request('http://localhost/browsers'),
      makeEnv({
        cacheRow: {
          total_fingerprints: 200,
          unique_full_hash: 150,
          unique_hardware_hash: 140,
          updated_at: Date.now(),
          browser_distribution: JSON.stringify(stale),
        },
      }) as never
    );
    expect(res.headers.get('X-Cache-Source')).toBe('live-query');
    const json = (await res.json()) as any;
    expect(json.data.total).toBe(120);
  });

  it('keeps the legacy bucket key names on countries/screens/gpus', async () => {
    const env = makeEnv() as never;
    const countries = (await (await stats.fetch(new Request('http://localhost/countries'), env)).json()) as any;
    const screens = (await (await stats.fetch(new Request('http://localhost/screens'), env)).json()) as any;
    const gpus = (await (await stats.fetch(new Request('http://localhost/gpus'), env)).json()) as any;
    expect(countries.data.distribution[0].code).toBe('US');
    expect(screens.data.distribution[0].resolution).toBe('1920x1080');
    expect(gpus.data.distribution[0].vendor).toBe('NVIDIA');
  });

  it('serves the daily trend from daily_stats', async () => {
    const res = await stats.fetch(new Request('http://localhost/daily?days=7'), makeEnv() as never);
    const json = (await res.json()) as any;
    expect(res.headers.get('X-Cache-Source')).toBe('pre-aggregated');
    expect(json.data.trends).toHaveLength(2);
    expect(json.data.period_days).toBe(7);
  });

  it('returns the full dashboard payload from /summary', async () => {
    const res = await stats.fetch(
      new Request('http://localhost/summary?limit=2&days=14'),
      makeEnv() as never
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.totals).toEqual({
      total_fingerprints: 10,
      unique_sessions: 3,
      unique_devices: 2,
    });
    for (const key of ['browsers', 'os', 'devices', 'countries', 'screens', 'gpus']) {
      const view = json.data.distributions[key];
      expect(Array.isArray(view.buckets)).toBe(true);
      expect(view.buckets[0]).toHaveProperty('name');
      expect(view.buckets[0]).toHaveProperty('percentage');
      expect(view.total).toBe(120);
    }
    expect(json.data.daily.trends).toHaveLength(2);
    expect(json.data.daily.period_days).toBe(14);
    expect(json.data.source).toBe('live');
  });
});

describe('health route', () => {
  it('reports healthy and includes db latency + deletion queue', async () => {
    const res = await health.fetch(new Request('http://localhost/'), makeEnv() as never);
    const json = (await res.json()) as any;
    expect(json.status).toBe('healthy');
    expect(typeof json.checks.db_latency_ms).toBe('number');
    expect(json.checks.deletion_queue.pending).toBe(2);
    expect(json.checks.deletion_queue.max_retry_count).toBe(1);
    expect(json.checks.deletion_queue.oldest_pending_age_ms).toBeGreaterThan(0);
  });
});
