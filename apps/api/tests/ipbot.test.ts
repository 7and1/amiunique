import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { lookupIP, isHighRisk, summarizeIPIntel, type IPIntelData } from '../src/lib/ipbot.js';
import { sha256 } from '../src/lib/hash.js';
import type { Env } from '../src/types/env.js';

type PutOptions = { expirationTtl?: number };

async function cacheKeyFor(ip: string): Promise<string> {
  return `ipintel:${await sha256(ip)}`;
}

function createMockKV() {
  const store = new Map<string, string>();
  const putOptions = new Map<string, PutOptions>();
  return {
    store,
    putOptions,
    async get(key: string, _type?: string) {
      const value = store.get(key);
      return value ? JSON.parse(value) : null;
    },
    async put(key: string, value: string, options?: PutOptions) {
      store.set(key, value);
      if (options) putOptions.set(key, options);
    },
  };
}

function createEnv(kv = createMockKV()) {
  return {
    kv,
    env: {
      IPBOT_API_ORIGIN: 'https://ipbot.test',
      IPBOT_API_KEY: 'test-key',
      RATE_LIMIT_KV: kv,
    } as unknown as Pick<Env, 'IPBOT_API_ORIGIN' | 'IPBOT_API_KEY' | 'RATE_LIMIT_KV'>,
  };
}

const SAMPLE_DATA: IPIntelData = {
  ip: '8.8.8.8',
  score: { ip_score: 88, risk_score: 12, band: 'excellent' },
  classification: { usage_type: 'infrastructure', is_datacenter: true, is_proxy: false },
  network: { asn: 15169, org: 'Google LLC' },
};

const HIGH_RISK_DATA: IPIntelData = {
  ip: '1.2.3.4',
  score: { ip_score: 10, risk_score: 90, band: 'danger' },
  classification: { is_proxy: true },
};

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('lookupIP', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns null when IPBot env is not configured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { kv } = createEnv();

    const result = await lookupIP('8.8.8.8', {
      RATE_LIMIT_KV: kv as unknown as KVNamespace,
    } as Env);

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null for empty or unknown IP', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { env } = createEnv();

    expect(await lookupIP('', env)).toBeNull();
    expect(await lookupIP('unknown', env)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches with X-API-Key header and caches result for 24h', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(SAMPLE_DATA, 200, {
        'X-RateLimit-Limit': '600',
        'X-RateLimit-Remaining': '590',
        'X-RateLimit-Tier': 'pro',
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { env, kv } = createEnv();

    const result = await lookupIP('8.8.8.8', env);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('https://ipbot.test/v1/ip/8.8.8.8');
    expect(init.headers['X-API-Key']).toBe('test-key');

    expect(result).not.toBeNull();
    expect(result!.cached).toBe(false);
    expect(result!.data.score?.risk_score).toBe(12);
    const cacheKey = await cacheKeyFor('8.8.8.8');
    expect(kv.putOptions.get(cacheKey)?.expirationTtl).toBe(24 * 60 * 60);
    expect([...kv.store.keys()].join()).not.toContain('8.8.8.8');
    expect(kv.store.get(cacheKey)).not.toContain('8.8.8.8');
  });

  it('normalizes provider ASN strings before returning and caching', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          ...SAMPLE_DATA,
          network: { asn: 'AS15169', org: 'Google LLC' },
        })
      )
    );
    const { env, kv } = createEnv();

    const result = await lookupIP('8.8.8.8', env);
    const cached = JSON.parse(kv.store.get(await cacheKeyFor('8.8.8.8')) || '{}');

    expect(result?.data.network?.asn).toBe(15169);
    expect(cached.data.network.asn).toBe(15169);
  });

  it('serves cached result without fetching', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { env, kv } = createEnv();
    kv.store.set(
      await cacheKeyFor('8.8.8.8'),
      JSON.stringify({ data: SAMPLE_DATA, fetched_at: 123 })
    );

    const result = await lookupIP('8.8.8.8', env);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result!.cached).toBe(true);
    expect(result!.fetched_at).toBe(123);
    expect(result!.data.network?.asn).toBe(15169);
  });

  it('caches high-risk results for 1h only', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(HIGH_RISK_DATA)));
    const { env, kv } = createEnv();

    const result = await lookupIP('1.2.3.4', env);

    expect(result!.data.score?.band).toBe('danger');
    expect(kv.putOptions.get(await cacheKeyFor('1.2.3.4'))?.expirationTtl).toBe(60 * 60);
  });

  it('does not retry by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'rate limited' }, 429));
    vi.stubGlobal('fetch', fetchMock);
    const { env } = createEnv();

    const result = await lookupIP('8.8.8.8', env);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  it('retries after 429 and succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'rate limited' }, 429))
      .mockResolvedValueOnce(jsonResponse(SAMPLE_DATA));
    vi.stubGlobal('fetch', fetchMock);
    const { env } = createEnv();

    const result = await lookupIP('8.8.8.8', env, { retryDelaysMs: [0, 0] });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result!.data.ip).toBeUndefined();
  });

  it('gives up after exhausting 429 retries', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'rate limited' }, 429));
    vi.stubGlobal('fetch', fetchMock);
    const { env } = createEnv();

    const result = await lookupIP('8.8.8.8', env, { retryDelaysMs: [0, 0] });

    expect(fetchMock).toHaveBeenCalledTimes(3); // initial + 2 retries
    expect(result).toBeNull();
  });

  it('returns null on server errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'boom' }, 500)));
    const { env } = createEnv();

    expect(await lookupIP('8.8.8.8', env)).toBeNull();
  });

  it('returns null when fetch throws (timeout/network)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
    const { env } = createEnv();

    expect(await lookupIP('8.8.8.8', env)).toBeNull();
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain('8.8.8.8');
  });

  it('rejects oversized or invalid provider responses', async () => {
    const oversized = jsonResponse({ score: { band: 'x'.repeat(70 * 1024) } }, 200, {
      'Content-Length': String(70 * 1024),
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(oversized));
    const { env } = createEnv();

    expect(await lookupIP('8.8.8.8', env)).toBeNull();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(jsonResponse({ score: { risk_score: 'high' } }))
    );
    expect(await lookupIP('8.8.8.8', env)).toBeNull();
  });

  it('works without KV (skips caching)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(SAMPLE_DATA));
    vi.stubGlobal('fetch', fetchMock);

    const result = await lookupIP('8.8.8.8', {
      IPBOT_API_ORIGIN: 'https://ipbot.test',
      IPBOT_API_KEY: 'test-key',
      RATE_LIMIT_KV: undefined as unknown as KVNamespace,
    } as Env);

    expect(result!.cached).toBe(false);
    expect(result!.data.ip).toBeUndefined();
  });

  it('skips the provider once the daily budget is spent but still serves cache', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(SAMPLE_DATA));
    vi.stubGlobal('fetch', fetchMock);
    const { env, kv } = createEnv();
    const today = new Date().toISOString().slice(0, 10);
    kv.store.set(`ipbot:budget:${today}`, JSON.stringify(2000));

    // Cold lookup is refused rather than charged to the provider
    expect(await lookupIP('8.8.8.8', env)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();

    // A cached address is unaffected by the budget
    kv.store.set(
      await cacheKeyFor('1.2.3.4'),
      JSON.stringify({ data: SAMPLE_DATA, fetched_at: 456 })
    );
    const cached = await lookupIP('1.2.3.4', env);

    expect(cached!.cached).toBe(true);
    expect(cached!.data.score?.risk_score).toBe(12);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('counts cold fetches against the daily budget without logging the address', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(SAMPLE_DATA)));
    const { env, kv } = createEnv();
    const budget = `ipbot:budget:${new Date().toISOString().slice(0, 10)}`;

    await lookupIP('8.8.8.8', env);
    expect(kv.store.get(budget)).toBe('1');
    expect(kv.putOptions.get(budget)?.expirationTtl).toBe(2 * 24 * 60 * 60);

    await lookupIP('9.9.9.9', env);
    expect(kv.store.get(budget)).toBe('2');
    expect(budget).not.toContain('8.8.8.8');
  });

  it('fetches anyway when the budget counter cannot be read', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(SAMPLE_DATA));
    vi.stubGlobal('fetch', fetchMock);
    const kv = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key.startsWith('ipbot:budget:')) return Promise.reject(new Error('KV unavailable'));
        return Promise.resolve(null);
      }),
      put: vi.fn().mockResolvedValue(undefined),
    } as unknown as KVNamespace;

    const result = await lookupIP('8.8.8.8', {
      IPBOT_API_ORIGIN: 'https://ipbot.test',
      IPBOT_API_KEY: 'test-key',
      RATE_LIMIT_KV: kv,
    } as Env);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result!.cached).toBe(false);
  });

  it('does not call the provider when a required cache cannot be read', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const failingKV = {
      get: vi.fn().mockRejectedValue(new Error('KV unavailable')),
      put: vi.fn(),
    } as unknown as KVNamespace;
    const { env } = createEnv(failingKV as unknown as ReturnType<typeof createMockKV>);

    const result = await lookupIP('8.8.8.8', env, { requireCache: true });

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('isHighRisk', () => {
  it('flags high risk_score and bad bands', () => {
    expect(isHighRisk({ ip: 'x', score: { risk_score: 70 } })).toBe(true);
    expect(isHighRisk({ ip: 'x', score: { risk_score: 10, band: 'danger' } })).toBe(true);
    expect(isHighRisk({ ip: 'x', score: { risk_score: 10, band: 'poor' } })).toBe(true);
  });

  it('does not flag normal results', () => {
    expect(isHighRisk({ ip: 'x', score: { risk_score: 12, band: 'excellent' } })).toBe(false);
    expect(isHighRisk({ ip: 'x' })).toBe(false);
  });
});

describe('summarizeIPIntel', () => {
  it('returns null for null input', () => {
    expect(summarizeIPIntel(null)).toBeNull();
  });

  it('produces a compact summary', () => {
    const summary = summarizeIPIntel({ data: SAMPLE_DATA, cached: true, fetched_at: 1 });
    expect(summary).toEqual({
      risk_score: 12,
      ip_score: 88,
      band: 'excellent',
      usage_type: 'infrastructure',
      is_datacenter: true,
      is_proxy: false,
      threat_level: null,
      asn: 15169,
      asn_org: 'Google LLC',
      operator: null,
      cached: true,
    });
  });
});
