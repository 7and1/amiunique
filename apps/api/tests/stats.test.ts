import { describe, it, expect } from 'vitest';
import stats from '../src/routes/stats.js';
import health from '../src/routes/health.js';
import type { Env } from '../src/types/env.js';

type MockRow = Record<string, unknown>;

type MockStatement = {
  bind: (..._args: unknown[]) => MockStatement;
  first: () => Promise<MockRow>;
  all: () => Promise<{ results: MockRow[] }>;
  run: () => Promise<{ success: boolean }>;
};

type MockDB = {
  prepare: (query: string) => MockStatement;
};

function createMockDB(): MockDB {
  return {
    prepare(query: string): MockStatement {
      const stmt: MockStatement = {
        bind: () => stmt,
        async first() {
          if (query.includes('full_hash')) return { count: 3 };
          if (query.includes('hardware_hash')) return { count: 2 };
          if (query.includes('SELECT COUNT(*) as count FROM visits')) return { count: 10 };
          if (query.includes('SELECT 1 as ok')) return { ok: 1 };
          return { count: 0 };
        },
        async all() {
          if (query.includes('meta_browser')) {
            return { results: [
              { browser: 'Chrome', count: 70 },
              { browser: 'Firefox', count: 30 },
            ] };
          }
          if (query.includes('meta_os')) {
            return { results: [
              { os: 'Windows', count: 60 },
              { os: 'macOS', count: 40 },
            ] };
          }
          if (query.includes('meta_device_type')) {
            return { results: [
              { device: 'desktop', count: 80 },
              { device: 'mobile', count: 20 },
            ] };
          }
          if (query.includes('meta_country')) {
            return { results: [
              { country: 'US', count: 50 },
              { country: 'FR', count: 10 },
            ] };
          }
          if (query.includes('meta_screen')) {
            return { results: [
              { screen: '1920x1080', count: 40 },
              { screen: '1366x768', count: 20 },
            ] };
          }
          if (query.includes('meta_gpu_vendor')) {
            return { results: [
              { gpu: 'NVIDIA', count: 30 },
              { gpu: 'AMD', count: 10 },
            ] };
          }
          if (query.includes('date(created_at')) {
            return { results: [
              { date: '2024-01-01', total_visits: 10, unique_devices: 8 },
              { date: '2024-01-02', total_visits: 12, unique_devices: 9 },
            ] };
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

const env = {
  DB: createMockDB(),
  ENVIRONMENT: 'test',
} as unknown as Env;

describe('stats routes', () => {
  it('returns global stats with counts', async () => {
    const res = await stats.fetch(new Request('http://localhost/'), env as never);
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.data.total_fingerprints).toBe(10);
    expect(json.data.unique_sessions).toBe(3);
    expect(json.data.unique_devices).toBe(2);
  });

  it('returns browser distribution with percentages', async () => {
    const res = await stats.fetch(new Request('http://localhost/browsers'), env as never);
    const json = await res.json() as any;
    expect(json.data.distribution[0].name).toBe('Chrome');
    expect(json.data.distribution[0].percentage).toBe('70.0');
  });
});

describe('health route', () => {
  it('reports healthy and includes db latency', async () => {
    const res = await health.fetch(new Request('http://localhost/'), env as never);
    const json = await res.json() as any;
    expect(json.status).toBe('healthy');
    expect(typeof json.checks.db_latency_ms).toBe('number');
  });
});
