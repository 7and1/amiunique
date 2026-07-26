import { describe, it, expect, vi } from 'vitest';
import { handleScheduled } from '../src/scheduled.js';
import type { Env } from '../src/types/env.js';

interface Recorded {
  sql: string;
  values: unknown[];
}

interface MockDBOptions {
  /** SQL substring → run() rejects for matching statements */
  failRunMatching?: string;
}

function createMockDB(options: MockDBOptions = {}) {
  const statements: Recorded[] = [];

  const db = {
    prepare(sql: string) {
      const record: Recorded = { sql, values: [] };
      statements.push(record);
      const stmt = {
        bind(...values: unknown[]) {
          record.values = values;
          return stmt;
        },
        async first() {
          if (sql.includes('as total FROM visits')) return { total: 100 };
          if (sql.includes('COUNT(DISTINCT full_hash)')) return { count: 30 };
          if (sql.includes('COUNT(DISTINCT hardware_hash)')) return { count: 20 };
          if (sql.includes('SELECT COUNT(*) as count FROM visits')) return { count: 100 };
          return { count: 0 };
        },
        async all() {
          if (sql.includes('GROUP BY meta_')) {
            return { results: [{ name: 'Sample', count: 10 }] };
          }
          // deletion queue scan and everything else: empty
          return { results: [] };
        },
        async run() {
          if (options.failRunMatching && sql.includes(options.failRunMatching)) {
            throw new Error(`forced failure for ${options.failRunMatching}`);
          }
          return { success: true, meta: { changes: 1 } };
        },
      };
      return stmt;
    },
  };

  return { db, statements };
}

function createKV(overrides: Partial<Record<'get' | 'put', unknown>> = {}) {
  return {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as KVNamespace & { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };
}

function makeEnv(db: unknown, kv: unknown): Env {
  return { DB: db, RATE_LIMIT_KV: kv, ENVIRONMENT: 'test' } as unknown as Env;
}

const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

function event(cron: string): ScheduledEvent {
  return { cron, scheduledTime: Date.now(), noRetry: () => {} } as unknown as ScheduledEvent;
}

describe('scheduled: */5 stats refresh', () => {
  it('writes all six distribution columns and rolls up daily_stats', async () => {
    const { db, statements } = createMockDB();
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await handleScheduled(event('*/5 * * * *'), makeEnv(db, createKV()), ctx);

    const upsert = statements.find(s => s.sql.includes('INSERT OR REPLACE INTO stats_cache'));
    expect(upsert).toBeDefined();
    for (const column of [
      'browser_distribution',
      'os_distribution',
      'country_distribution',
      'screen_distribution',
      'device_distribution',
      'gpu_distribution',
    ]) {
      expect(upsert!.sql).toContain(column);
    }
    // id is inlined; 10 bound values = 4 scalars + 6 distribution JSON payloads
    expect(upsert!.values).toHaveLength(10);
    const distributionPayloads = upsert!.values.slice(4) as string[];
    for (const payload of distributionPayloads) {
      const parsed = JSON.parse(payload);
      expect(parsed.v).toBe(1);
      expect(parsed.total).toBe(100);
      expect(parsed.buckets[0]).toEqual({ name: 'Sample', count: 10 });
    }

    const daily = statements.find(s => s.sql.includes('INSERT OR REPLACE INTO daily_stats'));
    expect(daily).toBeDefined();
  });
});

describe('scheduled: hourly maintenance marker', () => {
  it('runs retention when the marker is missing and advances it on success', async () => {
    const { db, statements } = createMockDB();
    const kv = createKV();
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await handleScheduled(event('0 * * * *'), makeEnv(db, kv), ctx);

    expect(kv.get).toHaveBeenCalledWith('maint:last_success');
    expect(statements.some(s => s.sql.includes('json_remove'))).toBe(true);
    expect(statements.some(s => s.sql.includes('DELETE FROM visits'))).toBe(true);
    expect(kv.put).toHaveBeenCalledWith('maint:last_success', expect.any(String));
  });

  it('skips retention when the marker is fresh', async () => {
    const { db, statements } = createMockDB();
    const kv = createKV({ get: vi.fn().mockResolvedValue(String(Date.now() - 60_000)) });
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await handleScheduled(event('0 * * * *'), makeEnv(db, kv), ctx);

    expect(statements.some(s => s.sql.includes('json_remove'))).toBe(false);
    expect(statements.some(s => s.sql.includes('DELETE FROM visits'))).toBe(false);
    expect(kv.put).not.toHaveBeenCalled();
  });

  it('runs retention when the marker read throws (idempotent work)', async () => {
    const { db, statements } = createMockDB();
    const kv = createKV({ get: vi.fn().mockRejectedValue(new Error('kv down')) });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await handleScheduled(event('0 * * * *'), makeEnv(db, kv), ctx);

    expect(statements.some(s => s.sql.includes('DELETE FROM visits'))).toBe(true);
  });

  it('does not advance the marker when a maintenance step fails', async () => {
    const { db } = createMockDB({ failRunMatching: 'DELETE FROM visits' });
    const kv = createKV();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await handleScheduled(event('0 * * * *'), makeEnv(db, kv), ctx);

    expect(kv.put).not.toHaveBeenCalled();
  });
});
