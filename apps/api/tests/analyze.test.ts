/**
 * Integration tests for /api/analyze endpoint
 * Tests fingerprint submission, validation, and response structure
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import app from '../src/index.js';
import type { ConsistencyReport } from '../src/lib/cross-check.js';
import { sha256 } from '../src/lib/hash.js';

// Mock KV namespace for rate limiting
const createMockKV = () => ({
  get: vi.fn().mockResolvedValue(null),
  put: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
});

// Mock D1 database with configurable responses
const createMockD1 = (
  options: {
    uniqueCount?: number;
    hardwareCount?: number;
    softwareVariantCount?: number;
    totalCount?: number;
    insertSuccess?: boolean;
    insertChanges?: number;
    existingVisit?: 'matching' | 'different' | 'missing';
  } = {}
) => {
  const {
    uniqueCount = 1,
    hardwareCount = 1,
    softwareVariantCount = 1,
    totalCount = 1,
    insertSuccess = true,
    insertChanges = 1,
    existingVisit = 'matching',
  } = options;
  const bindings: Array<{ sql: string; values: unknown[] }> = [];
  const events: string[] = [];

  const mockPrepare = vi.fn().mockImplementation((sql: string) => {
    // Create mock first function that handles SQL-based routing
    const mockFirst = vi.fn().mockImplementation(() => {
      events.push(`first:${sql}`);

      if (sql.includes('WHERE id = ?')) {
        if (existingVisit === 'missing') return Promise.resolve(null);
        if (existingVisit === 'different') {
          return Promise.resolve({
            hardware_hash: 'different-hardware',
            software_hash: 'different-software',
            full_hash: 'different-full',
          });
        }
        const insert = bindings.find(binding => binding.sql.includes('INTO visits'));
        return Promise.resolve({
          hardware_hash: insert?.values[2],
          software_hash: insert?.values[3],
          full_hash: insert?.values[4],
        });
      }

      if (sql.includes('AS exact_count')) {
        return Promise.resolve({
          exact_count: uniqueCount,
          hardware_count: hardwareCount,
          browser_variant_count: softwareVariantCount,
          total_count: totalCount,
        });
      }

      // Determine which COUNT query this is based on SQL
      if (sql.includes('COUNT(DISTINCT software_hash)')) {
        return Promise.resolve({ count: softwareVariantCount });
      } else if (sql.includes('full_hash')) {
        return Promise.resolve({ count: uniqueCount });
      } else if (sql.includes('hardware_hash')) {
        return Promise.resolve({ count: hardwareCount });
      } else if (sql.includes('COUNT(*)')) {
        return Promise.resolve({ count: totalCount });
      }
      return Promise.resolve({ count: 0 });
    });
    const mockRun = vi.fn().mockImplementation(() => {
      events.push(`run:${sql}`);
      return Promise.resolve({
        success: insertSuccess,
        meta: { changes: insertChanges },
      });
    });

    return {
      // For queries without bind (like SELECT COUNT(*) FROM visits)
      first: mockFirst,
      run: mockRun,
      all: vi.fn().mockResolvedValue({ results: [] }),
      // For queries with bind
      bind: vi.fn().mockImplementation((...values: unknown[]) => {
        bindings.push({ sql, values });
        return {
          run: mockRun,
          first: mockFirst,
          all: vi.fn().mockResolvedValue({ results: [] }),
        };
      }),
    };
  });

  return { prepare: mockPrepare, bindings, events };
};

// Valid fingerprint payload
const validFingerprint = {
  hw_canvas_hash: 'abc123',
  hw_webgl_hash: 'def456',
  hw_webgl_vendor: 'NVIDIA Corporation',
  hw_webgl_renderer: 'GeForce RTX 3080',
  hw_audio_hash: 'ghi789',
  hw_cpu_cores: 8,
  hw_memory: 16,
  hw_screen_width: 1920,
  hw_screen_height: 1080,
  hw_color_depth: 24,
  hw_pixel_ratio: 1,
  sys_platform: 'Win32',
  sys_user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
  sys_language: 'en-US',
  sys_languages: ['en-US', 'en'],
  sys_timezone: 'America/New_York',
  sys_tz_offset: -300,
  cap_cookies: true,
  cap_local_storage: true,
};

// Helper to create mock request
const createRequest = (body: unknown, headers: Record<string, string> = {}) => {
  const jsonBody = JSON.stringify(body);
  return new Request('http://localhost/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': jsonBody.length.toString(),
      ...headers,
    },
    body: jsonBody,
  });
};

interface AnalyzeTestResponse {
  success: boolean;
  code?: string;
  details?: Record<string, unknown>;
  ip_intel?: unknown;
  consistency?: ConsistencyReport;
  hashes: {
    gold: string;
    silver: string;
    bronze: string;
  };
  result: {
    is_unique: boolean;
    uniqueness_ratio: number;
    tracking_risk: string;
    message: string;
    exact_match_count: number;
    hardware_match_count: number;
    browser_variant_count: number;
    total_fingerprints: number;
    uniqueness_display: string;
    cross_browser_detected: boolean;
  };
  meta: {
    id: string;
    timestamp: number;
    processing_time_ms: number;
  };
  lies: {
    os_mismatch: boolean;
    browser_mismatch: boolean;
    resolution_mismatch: boolean;
    timezone_mismatch: boolean;
    webgl_mismatch: boolean;
    headless: boolean;
    automation: boolean;
  };
}

async function readAnalyzeResponse(response: Response): Promise<AnalyzeTestResponse> {
  return response.json<AnalyzeTestResponse>();
}

describe('POST /api/analyze', () => {
  let mockKV: ReturnType<typeof createMockKV>;

  // Create env with custom db and KV
  const createEnv = (db: ReturnType<typeof createMockD1>, kv = mockKV) => ({
    DB: db,
    RATE_LIMIT_KV: kv,
    ENVIRONMENT: 'test',
  });

  beforeEach(() => {
    mockKV = createMockKV();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('Success cases', () => {
    it('should accept valid fingerprint and return success', async () => {
      const db = createMockD1();
      const env = createEnv(db);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json).toHaveProperty('hashes');
      expect(json).toHaveProperty('result');
      expect(json).toHaveProperty('meta');
    });

    it('should return three lock hashes', async () => {
      const db = createMockD1();
      const env = createEnv(db);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(json.hashes).toHaveProperty('gold');
      expect(json.hashes).toHaveProperty('silver');
      expect(json.hashes).toHaveProperty('bronze');

      // Hashes should be 64-char hex strings
      expect(json.hashes.gold).toMatch(/^[0-9a-f]{64}$/);
      expect(json.hashes.silver).toMatch(/^[0-9a-f]{64}$/);
      expect(json.hashes.bronze).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should return result metrics', async () => {
      const db = createMockD1();
      const env = createEnv(db);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(json.result).toHaveProperty('is_unique');
      expect(json.result).toHaveProperty('uniqueness_ratio');
      expect(json.result).toHaveProperty('tracking_risk');
      expect(json.result).toHaveProperty('message');
      expect(json.result).toHaveProperty('exact_match_count');
      expect(json.result).toHaveProperty('hardware_match_count');
    });

    it('should include processing time in meta', async () => {
      const db = createMockD1();
      const env = createEnv(db);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(json.meta).toHaveProperty('id');
      expect(json.meta).toHaveProperty('timestamp');
      expect(json.meta).toHaveProperty('processing_time_ms');
      expect(typeof json.meta.processing_time_ms).toBe('number');
    });

    it('should use the idempotency key as the visit ID and count after inserting', async () => {
      const db = createMockD1();
      const env = createEnv(db);
      const submissionId = '4d9c3c28-18f3-4e3e-92ba-7984e554f45e';
      const req = createRequest(validFingerprint, { 'Idempotency-Key': submissionId });

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);
      const insert = db.bindings.find(binding => binding.sql.includes('INTO visits'));
      const insertEvent = db.events.findIndex(event => event.startsWith('run:INSERT'));
      const firstCountEvent = db.events.findIndex(event => event.startsWith('first:'));

      expect(res.status).toBe(200);
      expect(json.meta.id).toBe(submissionId);
      expect(insert?.sql).toContain('INSERT OR IGNORE INTO visits');
      expect(insert?.values[0]).toBe(submissionId);
      expect(insertEvent).toBeGreaterThanOrEqual(0);
      expect(firstCountEvent).toBeGreaterThan(insertEvent);
    });

    it('should return the existing observation when the idempotency key is replayed', async () => {
      const db = createMockD1({
        insertChanges: 0,
        existingVisit: 'matching',
        uniqueCount: 1,
        hardwareCount: 1,
        softwareVariantCount: 1,
        totalCount: 1,
      });
      const env = createEnv(db);
      const submissionId = '46c54715-dfad-43d9-8e35-c2a47bc89428';
      const req = createRequest(validFingerprint, { 'Idempotency-Key': submissionId });

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(res.status).toBe(200);
      expect(json.meta.id).toBe(submissionId);
      expect(json.result.exact_match_count).toBe(1);
      expect(json.result.total_fingerprints).toBe(1);
    });

    it('should reject an idempotency key reused for a different fingerprint', async () => {
      const db = createMockD1({
        insertChanges: 0,
        existingVisit: 'different',
      });
      const env = createEnv(db);
      const submissionId = '0ce05326-d075-4959-9c04-176f073b85d2';
      const req = createRequest(validFingerprint, { 'Idempotency-Key': submissionId });

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(res.status).toBe(409);
      expect(json.success).toBe(false);
      expect(json.code).toBe('IDEMPOTENCY_CONFLICT');
    });

    it('should accept minimal fingerprint', async () => {
      const minimal = { hw_canvas_hash: 'abc123' };
      const db = createMockD1();
      const env = createEnv(db);
      const req = createRequest(minimal);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('should return and persist only redacted WebRTC details', async () => {
      const db = createMockD1();
      const leakedCandidate = '198.51.100.10';
      const connectionIP = '198.51.100.11';
      const req = createRequest(
        {
          ...validFingerprint,
          rtc_available: true,
          rtc_local_ip: '192.168.1.20',
          rtc_public_ip: leakedCandidate,
          rtc_mdns_obfuscated: false,
          rtc_stun_available: true,
          rtc_ip_type: 'ipv4',
          rtc_media_device_count: 2,
          aux_webrtc_ip: leakedCandidate,
          unreviewed_network_value: connectionIP,
        },
        { 'CF-Connecting-IP': connectionIP }
      );

      const res = await app.fetch(req, createEnv(db));
      const json = await readAnalyzeResponse(res);
      const insert = db.bindings.find(binding => binding.sql.includes('INTO visits'));
      const persistedJson = insert?.values.at(-1);

      expect(res.status).toBe(200);
      expect(typeof persistedJson).toBe('string');
      const persisted = JSON.parse(persistedJson as string) as Record<string, unknown>;
      expect(json.details).not.toHaveProperty('rtc_local_ip');
      expect(json.details).not.toHaveProperty('rtc_public_ip');
      expect(json.details).not.toHaveProperty('aux_webrtc_ip');
      expect(json.details).not.toHaveProperty('unreviewed_network_value');
      expect(persisted).not.toHaveProperty('rtc_local_ip');
      expect(persisted).not.toHaveProperty('rtc_public_ip');
      expect(persisted).not.toHaveProperty('aux_webrtc_ip');
      expect(persisted).not.toHaveProperty('unreviewed_network_value');
      expect(JSON.stringify(json)).not.toContain(leakedCandidate);
      expect(json.consistency?.checks.find(check => check.code === 'webrtc_ip_leak')).toMatchObject(
        {
          status: 'flagged',
          state: 'leak_detected',
        }
      );
    });
  });

  describe('Validation errors', () => {
    it('should reject invalid JSON', async () => {
      const db = createMockD1();
      const env = createEnv(db);
      const req = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json{',
      });

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.code).toBe('JSON_PARSE_ERROR');
    });

    it('should reject payload over 50KB', async () => {
      const largePayload = {
        ...validFingerprint,
        extra_data: 'x'.repeat(60000),
      };
      const db = createMockD1();
      const env = createEnv(db);
      const req = createRequest(largePayload);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(res.status).toBe(413);
      expect(json.success).toBe(false);
      expect(json.code).toBe('PAYLOAD_TOO_LARGE');
    });

    it('should reject invalid field types', async () => {
      const invalid = {
        ...validFingerprint,
        hw_cpu_cores: 'not a number',
      };
      const db = createMockD1();
      const env = createEnv(db);
      const req = createRequest(invalid);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.code).toBe('VALIDATION_ERROR');
      expect(json.details).toBeDefined();
    });

    it('should reject out-of-range values', async () => {
      const invalid = {
        ...validFingerprint,
        hw_cpu_cores: 500, // Max is 256
      };
      const db = createMockD1();
      const env = createEnv(db);
      const req = createRequest(invalid);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
    });

    it('should reject strings exceeding max length', async () => {
      const invalid = {
        ...validFingerprint,
        hw_webgl_vendor: 'x'.repeat(300), // Max is 256
      };
      const db = createMockD1();
      const env = createEnv(db);
      const req = createRequest(invalid);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
    });

    it('should reject an invalid idempotency key', async () => {
      const db = createMockD1();
      const env = createEnv(db);
      const req = createRequest(validFingerprint, { 'Idempotency-Key': 'not-a-uuid' });

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.code).toBe('INVALID_IDEMPOTENCY_KEY');
    });
  });

  describe('Tracking risk calculation', () => {
    it('should mark unique fingerprint as high risk', async () => {
      const db = createMockD1({
        uniqueCount: 1,
        hardwareCount: 1,
        softwareVariantCount: 1,
        totalCount: 1,
      });
      const env = createEnv(db);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(json.result.is_unique).toBe(true);
      expect(json.result.uniqueness_ratio).toBe(1);
      expect(json.result.uniqueness_display).toBe('1 of 1');
      expect(json.result.tracking_risk).toBe('high');
    });

    it('should mark common fingerprint as low risk', async () => {
      const db = createMockD1({
        uniqueCount: 101,
        hardwareCount: 101,
        softwareVariantCount: 1,
        totalCount: 1001,
      });
      const env = createEnv(db);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(json.result.is_unique).toBe(false);
      expect(json.result.exact_match_count).toBe(101);
      expect(json.result.uniqueness_display).toBe('101 of 1,001');
      expect(json.result.tracking_risk).toBe('low');
    });

    it('should mark fingerprint with few matches as medium risk', async () => {
      const db = createMockD1({
        uniqueCount: 11,
        hardwareCount: 11,
        softwareVariantCount: 1,
        totalCount: 101,
      });
      const env = createEnv(db);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(json.result.is_unique).toBe(false);
      expect(json.result.exact_match_count).toBe(11);
      expect(json.result.tracking_risk).toBe('medium');
    });

    it('should keep a rare fingerprint in a large corpus at high risk', async () => {
      const db = createMockD1({
        uniqueCount: 5,
        hardwareCount: 5,
        softwareVariantCount: 1,
        totalCount: 6745,
      });
      const env = createEnv(db);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(json.result.uniqueness_display).toBe('5 of 6,745');
      expect(json.result.tracking_risk).toBe('high');
    });

    it('should detect cross-browser tracking', async () => {
      const db = createMockD1({
        uniqueCount: 1,
        hardwareCount: 5,
        softwareVariantCount: 2,
        totalCount: 100,
      });
      const env = createEnv(db);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(json.result.cross_browser_detected).toBe(true);
      expect(json.result.browser_variant_count).toBe(2);
      expect(json.result.tracking_risk).toBe('critical');
    });

    it('should not treat network-only full hash changes as cross-browser tracking', async () => {
      const db = createMockD1({
        uniqueCount: 1,
        hardwareCount: 5,
        softwareVariantCount: 1,
        totalCount: 100,
      });
      const env = createEnv(db);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(json.result.hardware_match_count).toBe(5);
      expect(json.result.browser_variant_count).toBe(1);
      expect(json.result.cross_browser_detected).toBe(false);
      expect(json.result.tracking_risk).toBe('high');
    });
  });

  describe('Lie detection passthrough', () => {
    it('should pass through lie detection flags', async () => {
      const withLies = {
        ...validFingerprint,
        lie_os_mismatch: true,
        lie_browser_mismatch: false,
        lie_timezone_mismatch: true,
      };
      const db = createMockD1();
      const env = createEnv(db);
      const req = createRequest(withLies);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(json.lies.os_mismatch).toBe(true);
      expect(json.lies.browser_mismatch).toBe(false);
      expect(json.lies.timezone_mismatch).toBe(true);
    });

    it('should default lie flags to false when not provided', async () => {
      const db = createMockD1();
      const env = createEnv(db);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(json.lies.os_mismatch).toBe(false);
      expect(json.lies.browser_mismatch).toBe(false);
      expect(json.lies.resolution_mismatch).toBe(false);
      expect(json.lies.timezone_mismatch).toBe(false);
      expect(json.lies.webgl_mismatch).toBe(false);
    });
  });

  describe('Rate limiting headers', () => {
    it('fails closed when the production native limiter binding is missing', async () => {
      const db = createMockD1();
      const req = createRequest(validFingerprint, {
        'CF-Connecting-IP': '1.2.3.4',
      });

      const res = await app.fetch(req, {
        DB: db,
        RATE_LIMIT_KV: mockKV,
        ENVIRONMENT: 'production',
      });
      const json = await readAnalyzeResponse(res);

      expect(res.status).toBe(503);
      expect(json.code).toBe('RATE_LIMIT_UNAVAILABLE');
      expect(db.prepare).not.toHaveBeenCalled();
    });

    it('honors the production native limiter decision', async () => {
      const db = createMockD1();
      const limit = vi.fn().mockResolvedValue({ success: false });
      const req = createRequest(validFingerprint, {
        'CF-Connecting-IP': '1.2.3.4',
      });

      const res = await app.fetch(req, {
        DB: db,
        RATE_LIMIT_KV: mockKV,
        ANALYZE_RATE_LIMITER: { limit },
        ENVIRONMENT: 'production',
      });

      expect(res.status).toBe(429);
      expect(limit).toHaveBeenCalledTimes(1);
      expect(db.prepare).not.toHaveBeenCalled();
    });

    it('should include rate limit headers when KV is available', async () => {
      const db = createMockD1();
      const env = createEnv(db);
      const req = createRequest(validFingerprint, {
        'CF-Connecting-IP': '1.2.3.4',
      });

      const res = await app.fetch(req, env);

      expect(res.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
      const expectedKey = `rl:${await sha256('1.2.3.4')}:/api/analyze`;
      expect(mockKV.get).toHaveBeenCalledWith(expectedKey, 'json');
      expect(mockKV.get.mock.calls.flat().join(' ')).not.toContain('1.2.3.4');
    });

    it('should skip rate limiting when KV is not available', async () => {
      // Env without KV - still needs a valid DB
      const db = createMockD1();
      const env = { DB: db, ENVIRONMENT: 'test' };
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      // Should still succeed without rate limit headers
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      // Headers won't be set when KV is unavailable
      expect(res.headers.get('X-RateLimit-Limit')).toBeNull();
    });
  });

  describe('CORS', () => {
    it('should allow the idempotency key on analyze preflight requests', async () => {
      const db = createMockD1();
      const env = createEnv(db);
      const req = new Request('http://localhost/api/analyze', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://amiunique.io',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type,idempotency-key',
        },
      });

      const res = await app.fetch(req, env);

      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Idempotency-Key');
    });
  });

  describe('Error handling', () => {
    it('should fail open after one 5000ms IP intelligence attempt', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('upstream timeout'));
      vi.stubGlobal('fetch', fetchMock);
      const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const db = createMockD1();
      const env = {
        ...createEnv(db),
        IPBOT_API_ORIGIN: 'https://ipbot.test',
        IPBOT_API_KEY: 'test-key',
      };
      const req = createRequest(validFingerprint, {
        'CF-Connecting-IP': '8.8.8.8',
      });

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(res.status).toBe(200);
      expect(json.ip_intel).toBeNull();
      expect(timeoutSpy).toHaveBeenCalledWith(5000);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors gracefully', async () => {
      // Create a mock that throws errors
      const errorDb = {
        prepare: vi.fn().mockImplementation(() => ({
          bind: vi.fn().mockReturnValue({
            run: vi.fn().mockRejectedValue(new Error('DB connection failed')),
            first: vi.fn().mockRejectedValue(new Error('DB connection failed')),
          }),
        })),
      };

      const env = createEnv(errorDb as ReturnType<typeof createMockD1>);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
    });

    it('should handle insert failure', async () => {
      // Create a mock where insert fails but queries succeed
      const failDb = createMockD1({ insertSuccess: false });
      const env = createEnv(failDb);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await readAnalyzeResponse(res);

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.code).toBe('DB_INSERT_FAILED');
    });
  });
});
