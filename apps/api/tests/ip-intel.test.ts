import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../src/index.js';
import type { Env } from '../src/types/env.js';

type PutOptions = { expirationTtl?: number };

function createMockKV() {
  const store = new Map<string, string>();
  return {
    store,
    async get(key: string, _type?: string) {
      const value = store.get(key);
      return value ? JSON.parse(value) : null;
    },
    async put(key: string, value: string, _options?: PutOptions) {
      store.set(key, value);
    },
  } as unknown as KVNamespace & { store: Map<string, string> };
}

function createMockRateLimiter(limit = 10): RateLimit {
  let count = 0;
  return {
    limit: vi.fn(async () => ({ success: ++count <= limit })),
  } as RateLimit;
}

function createEnv(
  configured = true,
  kv: KVNamespace | null = createMockKV(),
  limiter: RateLimit | null = createMockRateLimiter()
): Env {
  return {
    DB: {} as D1Database,
    RATE_LIMIT_KV: (kv ?? undefined) as unknown as KVNamespace,
    IP_INTEL_RATE_LIMITER: limiter ?? undefined,
    ENVIRONMENT: 'test',
    ...(configured
      ? {
          IPBOT_API_ORIGIN: 'https://ipbot.test',
          IPBOT_API_KEY: 'test-key',
        }
      : {}),
  } as Env;
}

function createRequest(
  options: {
    url?: string;
    address?: string;
    method?: string;
    headers?: Record<string, string>;
  } = {}
): Request {
  const { url = 'http://localhost/api/ip-intel', address, method = 'GET', headers = {} } = options;
  const request = new Request(url, {
    method,
    headers: {
      ...headers,
      ...(address ? { 'CF-Connecting-IP': address } : {}),
    },
  });
  Object.defineProperty(request, 'cf', {
    value: {
      asn: 15169,
      asOrganization: 'Google LLC',
      colo: 'SJC',
      country: 'US',
      city: 'Mountain View',
      region: 'California',
      timezone: 'America/Los_Angeles',
    },
  });
  return request;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/ip-intel', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('looks up only the current connection and returns a compact no-store response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        ip: '203.0.113.42',
        score: { ip_score: 88, risk_score: 12, band: 'excellent' },
        classification: {
          usage_type: 'residential',
          is_datacenter: false,
          is_proxy: false,
          threat_level: 'low',
        },
        network: { asn: 15169, org: 'Google LLC' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const env = createEnv();

    const response = await app.fetch(
      createRequest({
        address: '203.0.113.42',
        headers: {
          Origin: 'https://preview.amiunique.pages.dev',
          'X-Forwarded-For': '8.8.8.8',
          'X-Real-IP': '1.1.1.1',
        },
      }),
      env
    );
    const json = await response.json<{
      success: boolean;
      data: {
        address: string;
        masked_address: string;
        ip_version: string;
        network: { asn: number; country: string };
        intelligence: { risk_score: number };
        intelligence_status: string;
      };
    }>();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-store, max-age=0, must-revalidate'
    );
    expect(response.headers.get('CDN-Cache-Control')).toBe('no-store');
    expect(json.success).toBe(true);
    expect(json.data).toMatchObject({
      address: '203.0.113.42',
      masked_address: '203.0.113.x',
      ip_version: 'ipv4',
      network: { asn: 15169, country: 'US' },
      intelligence: { risk_score: 12 },
      intelligence_status: 'available',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/v1/ip/203.0.113.42');
    expect(fetchMock.mock.calls[0][0]).not.toContain('8.8.8.8');
    expect(fetchMock.mock.calls[0][0]).not.toContain('1.1.1.1');
    expect(fetchMock.mock.calls[0][1].headers['X-API-Key']).toBe('test-key');
    expect(env.IP_INTEL_RATE_LIMITER?.limit).toHaveBeenCalledOnce();
    const limiterKey = vi.mocked(env.IP_INTEL_RATE_LIMITER!.limit).mock.calls[0][0].key;
    expect(limiterKey).toMatch(/^[a-f0-9]{64}$/);
    expect(limiterKey).not.toContain('203.0.113.42');
    expect(JSON.stringify(json)).not.toContain('recommended_action');
    expect(JSON.stringify(json)).not.toContain('cached');
  });

  it('rejects arbitrary-IP query parameters without calling IPBot', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await app.fetch(
      createRequest({
        url: 'http://localhost/api/ip-intel?ip=8.8.8.8',
        address: '203.0.113.42',
      }),
      createEnv()
    );
    const json = await response.json<{ code: string }>();

    expect(response.status).toBe(400);
    expect(json.code).toBe('UNSUPPORTED_QUERY');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(console.log).mock.calls)).not.toContain('8.8.8.8');
  });

  it('requires a valid Cloudflare connection address and ignores spoofable fallback headers', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await app.fetch(
      createRequest({
        headers: {
          'X-Forwarded-For': '8.8.8.8',
          'X-Real-IP': '1.1.1.1',
        },
      }),
      createEnv()
    );
    const json = await response.json<{ code: string }>();

    expect(response.status).toBe(503);
    expect(json.code).toBe('CLIENT_IP_UNAVAILABLE');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns first-party connection facts when IPBot is not configured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await app.fetch(createRequest({ address: '2001:db8::42' }), createEnv(false));
    const json = await response.json<{
      data: {
        address: string;
        masked_address: string;
        ip_version: string;
        intelligence: null;
        intelligence_status: string;
      };
    }>();

    expect(response.status).toBe(200);
    expect(json.data).toMatchObject({
      address: '2001:db8::42',
      masked_address: '2001:db8:…',
      ip_version: 'ipv6',
      intelligence: null,
      intelligence_status: 'unavailable',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not call IPBot when rate-limit KV is unavailable', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await app.fetch(
      createRequest({ address: '203.0.113.42' }),
      createEnv(true, null)
    );
    const json = await response.json<{
      data: { address: string; intelligence: null; intelligence_status: string };
    }>();

    expect(response.status).toBe(200);
    expect(json.data).toMatchObject({
      address: '203.0.113.42',
      intelligence: null,
      intelligence_status: 'unavailable',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects unrelated Cloudflare tenant origins without exposing connection data', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await app.fetch(
      createRequest({
        address: '203.0.113.42',
        headers: { Origin: 'https://evil.pages.dev' },
      }),
      createEnv()
    );
    const body = await response.text();

    expect(response.status).toBe(403);
    expect(body).not.toContain('203.0.113.42');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps injected path addresses out of logs and 404 responses', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await app.fetch(
      createRequest({
        url: 'http://localhost/api/ip-intel/8.8.8.8',
        address: '203.0.113.42',
      }),
      createEnv()
    );
    const body = await response.text();

    expect(response.status).toBe(404);
    expect(body).not.toContain('8.8.8.8');
    expect(JSON.stringify(vi.mocked(console.log).mock.calls)).not.toContain('8.8.8.8');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not turn HEAD into an upstream lookup', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await app.fetch(
      createRequest({ address: '203.0.113.42', method: 'HEAD' }),
      createEnv()
    );

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('GET');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('enforces the dedicated ten-request window before another provider lookup', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        score: { risk_score: 12 },
        classification: { is_proxy: false },
        network: { asn: 15169 },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const env = createEnv();

    const responses = [];
    for (let request = 0; request < 11; request++) {
      responses.push(await app.fetch(createRequest({ address: '203.0.113.42' }), env));
    }

    expect(responses.slice(0, 10).every(response => response.status === 200)).toBe(true);
    expect(responses[10].status).toBe(429);
    expect(responses[10].headers.get('Cache-Control')).toContain('no-store');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('coalesces concurrent cache misses for one connection within an isolate', async () => {
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise<Response>(resolve => {
          setTimeout(
            () =>
              resolve(
                jsonResponse({
                  score: { risk_score: 12 },
                  classification: { is_proxy: false },
                  network: { asn: 15169 },
                })
              ),
            10
          );
        })
    );
    vi.stubGlobal('fetch', fetchMock);
    const env = createEnv();

    const responses = await Promise.all(
      Array.from({ length: 10 }, () => app.fetch(createRequest({ address: '203.0.113.42' }), env))
    );

    expect(responses.every(response => response.status === 200)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not call IPBot when the native limiter binding is missing', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await app.fetch(
      createRequest({ address: '203.0.113.42' }),
      createEnv(true, createMockKV(), null)
    );
    const json = await response.json<{
      data: { intelligence: null; intelligence_status: string };
    }>();

    expect(response.status).toBe(200);
    expect(json.data.intelligence).toBeNull();
    expect(json.data.intelligence_status).toBe('unavailable');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails closed before IPBot when the native limiter fails', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const failingLimiter = {
      limit: vi.fn().mockRejectedValue(new Error('Limiter unavailable')),
    } as unknown as RateLimit;

    const response = await app.fetch(
      createRequest({ address: '203.0.113.42' }),
      createEnv(true, createMockKV(), failingLimiter)
    );
    const json = await response.json<{ code: string }>();

    expect(response.status).toBe(503);
    expect(json.code).toBe('RATE_LIMIT_STORAGE_UNAVAILABLE');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('degrades without calling IPBot when the required cache cannot be read', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const failingKV = {
      get: vi.fn().mockRejectedValue(new Error('KV unavailable')),
      put: vi.fn(),
    } as unknown as KVNamespace;

    const response = await app.fetch(
      createRequest({ address: '203.0.113.42' }),
      createEnv(true, failingKV)
    );
    const json = await response.json<{
      data: { intelligence: null; intelligence_status: string };
    }>();

    expect(response.status).toBe(200);
    expect(json.data.intelligence).toBeNull();
    expect(json.data.intelligence_status).toBe('unavailable');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
