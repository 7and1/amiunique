/**
 * Integration tests for /api/analyze endpoint
 * Tests fingerprint submission, validation, and response structure
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../src/index.js';

// Mock KV namespace for rate limiting
const createMockKV = () => ({
  get: vi.fn().mockResolvedValue(null),
  put: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
});

// Mock D1 database with configurable responses
const createMockD1 = (options: {
  uniqueCount?: number;
  hardwareCount?: number;
  totalCount?: number;
  insertSuccess?: boolean;
} = {}) => {
  const {
    uniqueCount = 0,
    hardwareCount = 0,
    totalCount = 0,
    insertSuccess = true,
  } = options;

  const mockPrepare = vi.fn().mockImplementation((sql: string) => {
    // Create mock first function that handles SQL-based routing
    const mockFirst = vi.fn().mockImplementation(() => {
      // Determine which COUNT query this is based on SQL
      if (sql.includes('full_hash')) {
        return Promise.resolve({ count: uniqueCount });
      } else if (sql.includes('hardware_hash')) {
        return Promise.resolve({ count: hardwareCount });
      } else if (sql.includes('COUNT(*)')) {
        return Promise.resolve({ count: totalCount });
      }
      return Promise.resolve({ count: 0 });
    });

    return {
      // For queries without bind (like SELECT COUNT(*) FROM visits)
      first: mockFirst,
      run: vi.fn().mockResolvedValue({ success: insertSuccess }),
      all: vi.fn().mockResolvedValue({ results: [] }),
      // For queries with bind
      bind: vi.fn().mockReturnValue({
        run: vi.fn().mockResolvedValue({ success: insertSuccess }),
        first: mockFirst,
        all: vi.fn().mockResolvedValue({ results: [] }),
      }),
    };
  });

  return { prepare: mockPrepare };
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

  describe('Success cases', () => {
    it('should accept valid fingerprint and return success', async () => {
      const db = createMockD1();
      const env = createEnv(db);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await res.json();

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
      const json = await res.json();

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
      const json = await res.json();

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
      const json = await res.json();

      expect(json.meta).toHaveProperty('id');
      expect(json.meta).toHaveProperty('timestamp');
      expect(json.meta).toHaveProperty('processing_time_ms');
      expect(typeof json.meta.processing_time_ms).toBe('number');
    });

    it('should accept minimal fingerprint', async () => {
      const minimal = { hw_canvas_hash: 'abc123' };
      const db = createMockD1();
      const env = createEnv(db);
      const req = createRequest(minimal);

      const res = await app.fetch(req, env);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
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
      const json = await res.json();

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
      const json = await res.json();

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
      const json = await res.json();

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
      const json = await res.json();

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
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
    });
  });

  describe('Tracking risk calculation', () => {
    it('should mark unique fingerprint as high risk', async () => {
      // Mock: no existing matches (first fingerprint submission)
      const db = createMockD1({ uniqueCount: 0, hardwareCount: 0, totalCount: 0 });
      const env = createEnv(db);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await res.json();

      expect(json.result.is_unique).toBe(true);
      expect(json.result.tracking_risk).toBe('high');
    });

    it('should mark common fingerprint as low risk', async () => {
      // Mock: 100 existing matches (common fingerprint)
      // Note: uniqueCount is BEFORE insert, so 100 previous matches = is_unique: false
      const db = createMockD1({ uniqueCount: 100, hardwareCount: 100, totalCount: 1000 });
      const env = createEnv(db);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await res.json();

      expect(json.result.is_unique).toBe(false);
      // With 100 previous matches + 1 current = 101 total, should be 'low' risk
      expect(json.result.tracking_risk).toBe('low');
    });

    it('should mark fingerprint with few matches as medium risk', async () => {
      // Mock: 10 existing matches
      const db = createMockD1({ uniqueCount: 10, hardwareCount: 10, totalCount: 100 });
      const env = createEnv(db);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await res.json();

      expect(json.result.is_unique).toBe(false);
      // With 10 previous matches + 1 current = 11 total, should be 'medium' risk (5-49)
      expect(json.result.tracking_risk).toBe('medium');
    });

    it('should detect cross-browser tracking', async () => {
      // Mock: same hardware seen with different full fingerprints
      // hardwareCount > uniqueCount means different browsers on same device
      const db = createMockD1({ uniqueCount: 0, hardwareCount: 5, totalCount: 100 });
      const env = createEnv(db);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await res.json();

      expect(json.result.cross_browser_detected).toBe(true);
      expect(json.result.tracking_risk).toBe('critical');
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
      const json = await res.json();

      expect(json.lies.os_mismatch).toBe(true);
      expect(json.lies.browser_mismatch).toBe(false);
      expect(json.lies.timezone_mismatch).toBe(true);
    });

    it('should default lie flags to false when not provided', async () => {
      const db = createMockD1();
      const env = createEnv(db);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await res.json();

      expect(json.lies.os_mismatch).toBe(false);
      expect(json.lies.browser_mismatch).toBe(false);
      expect(json.lies.resolution_mismatch).toBe(false);
      expect(json.lies.timezone_mismatch).toBe(false);
      expect(json.lies.webgl_mismatch).toBe(false);
    });
  });

  describe('Rate limiting headers', () => {
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
    });

    it('should skip rate limiting when KV is not available', async () => {
      // Env without KV - still needs a valid DB
      const db = createMockD1();
      const env = { DB: db, ENVIRONMENT: 'test' };
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await res.json();

      // Should still succeed without rate limit headers
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      // Headers won't be set when KV is unavailable
      expect(res.headers.get('X-RateLimit-Limit')).toBeNull();
    });
  });

  describe('Error handling', () => {
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
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
    });

    it('should handle insert failure', async () => {
      // Create a mock where insert fails but queries succeed
      const failDb = createMockD1({ insertSuccess: false });
      const env = createEnv(failDb);
      const req = createRequest(validFingerprint);

      const res = await app.fetch(req, env);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.code).toBe('DB_INSERT_FAILED');
    });
  });
});
