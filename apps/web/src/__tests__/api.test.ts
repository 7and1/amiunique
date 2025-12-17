/**
 * Unit tests for API client
 * Tests API calls, caching, and error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Import after mocking
import {
  getGlobalStats,
  getBrowserDistribution,
  getOSDistribution,
  getDeviceDistribution,
  getCountryDistribution,
  getScreenDistribution,
  getDailyTrends,
  checkHealth,
  submitDeletionRequest,
  getDeletionStatus,
} from '../lib/api';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getGlobalStats', () => {
    it('should fetch and return stats', async () => {
      const mockStats = {
        success: true,
        data: {
          total_fingerprints: 1000000,
          unique_sessions: 500000,
          unique_devices: 300000,
          updated_at: Date.now(),
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
        headers: new Headers({ 'cf-cache-status': 'HIT' }),
      });

      const stats = await getGlobalStats();

      expect(stats.total_fingerprints).toBe(1000000);
      expect(stats.unique_sessions).toBe(500000);
      expect(stats.unique_devices).toBe(300000);
    });

    it('should cache stats in localStorage', async () => {
      const mockStats = {
        success: true,
        data: {
          total_fingerprints: 1000,
          unique_sessions: 500,
          unique_devices: 300,
          updated_at: Date.now(),
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
        headers: new Headers(),
      });

      await getGlobalStats();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'au_stats_global',
        expect.any(String)
      );
    });

    it('should fall back to cache on error', async () => {
      // Set up cache
      const cachedData = {
        timestamp: Date.now(),
        data: {
          total_fingerprints: 999,
          unique_sessions: 499,
          unique_devices: 299,
        },
      };
      localStorageMock.setItem('au_stats_global', JSON.stringify(cachedData));

      // Make fetch fail for all retry attempts (2 attempts)
      mockFetch.mockImplementation(() => Promise.reject(new Error('Network error')));

      // Need to advance timers for retry backoff
      const statsPromise = getGlobalStats();
      await vi.runAllTimersAsync();
      const stats = await statsPromise;

      expect(stats.total_fingerprints).toBe(999);
      mockFetch.mockReset();
    });

    it('should throw if no cache and fetch fails', { timeout: 10000 }, async () => {
      // Use real timers for this test since we're testing error propagation
      vi.useRealTimers();

      // Make fetch fail for all retry attempts (2 attempts)
      mockFetch.mockImplementation(() => Promise.reject(new Error('Network error')));

      // Verify the promise rejects
      await expect(getGlobalStats()).rejects.toThrow('Network error');

      // Reset to clean state
      mockFetch.mockReset();
      vi.useFakeTimers(); // Restore fake timers for other tests
    });

    it('should include source info from headers', async () => {
      const mockStats = {
        success: true,
        data: {
          total_fingerprints: 1000,
          unique_sessions: 500,
          unique_devices: 300,
          updated_at: Date.now(),
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
        headers: new Headers({ 'cf-cache-status': 'HIT' }),
      });

      const stats = await getGlobalStats();

      expect((stats as any)._source).toBe('edge-cache');
    });
  });

  describe('Distribution endpoints', () => {
    const mockDistribution = {
      success: true,
      data: {
        distribution: [
          { name: 'Chrome', count: 500, percentage: '50.0' },
          { name: 'Firefox', count: 300, percentage: '30.0' },
        ],
        total: 1000,
        updated_at: Date.now(),
      },
    };

    it('should fetch browser distribution', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDistribution),
      });

      const result = await getBrowserDistribution(10);

      expect(result.data.distribution).toHaveLength(2);
      expect(result.data.distribution[0].name).toBe('Chrome');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stats/browsers?limit=10'),
        expect.any(Object)
      );
    });

    it('should fetch OS distribution', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDistribution),
      });

      const result = await getOSDistribution(10);

      expect(result.data.distribution).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stats/os?limit=10'),
        expect.any(Object)
      );
    });

    it('should fetch device distribution', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDistribution),
      });

      const result = await getDeviceDistribution();

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stats/devices'),
        expect.any(Object)
      );
    });

    it('should fetch country distribution', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDistribution),
      });

      const result = await getCountryDistribution(20);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stats/countries?limit=20'),
        expect.any(Object)
      );
    });

    it('should fetch screen distribution', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDistribution),
      });

      const result = await getScreenDistribution(15);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stats/screens?limit=15'),
        expect.any(Object)
      );
    });
  });

  describe('getDailyTrends', () => {
    it('should fetch daily trends', async () => {
      const mockTrends = {
        success: true,
        data: {
          trends: [
            { date: '2024-01-01', total_visits: 100, unique_devices: 80 },
            { date: '2024-01-02', total_visits: 120, unique_devices: 95 },
          ],
          period_days: 30,
          updated_at: Date.now(),
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTrends),
      });

      const result = await getDailyTrends(30);

      expect(result.trends).toHaveLength(2);
      expect(result.period_days).toBe(30);
    });

    it('should use default 30 days', async () => {
      const mockTrends = {
        success: true,
        data: {
          trends: [],
          period_days: 30,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTrends),
      });

      await getDailyTrends();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stats/daily?days=30'),
        expect.any(Object)
      );
    });
  });

  describe('checkHealth', () => {
    it('should return health status', async () => {
      const mockHealth = {
        status: 'healthy',
        timestamp: Date.now(),
        latency_ms: 5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHealth),
      });

      const result = await checkHealth();

      expect(result.status).toBe('healthy');
      expect(result.latency_ms).toBe(5);
    });

    it('should handle health check failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(checkHealth()).rejects.toThrow();
    });
  });

  describe('Deletion API', () => {
    describe('submitDeletionRequest', () => {
      it('should submit deletion request', async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 'del-123',
            status: 'pending',
            created_at: Date.now(),
            sla_hours: 24,
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await submitDeletionRequest({
          hash_type: 'hardware',
          hash_value: 'a'.repeat(64),
          email: 'user@example.com',
        });

        expect(result.id).toBe('del-123');
        expect(result.status).toBe('pending');
      });

      it('should throw on API error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ success: false, message: 'Invalid hash' }),
        });

        await expect(
          submitDeletionRequest({
            hash_type: 'hardware',
            hash_value: 'invalid',
          })
        ).rejects.toThrow('Invalid hash');
      });
    });

    describe('getDeletionStatus', () => {
      it('should fetch deletion status', async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 'del-123',
            hash_type: 'hardware',
            status: 'completed',
            created_at: Date.now() - 3600000,
            completed_at: Date.now(),
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await getDeletionStatus('del-123');

        expect(result.id).toBe('del-123');
        expect(result.status).toBe('completed');
        expect(result.completed_at).toBeDefined();
      });

      it('should throw on not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () =>
            Promise.resolve({ success: false, message: 'Request not found' }),
        });

        await expect(getDeletionStatus('invalid-id')).rejects.toThrow(
          'Request not found'
        );
      });
    });
  });

  describe('Caching behavior', () => {
    it('should use cached data within TTL', async () => {
      // The cache stores the inner data object, not the full response wrapper
      // getCache returns parsed.data directly (with _cached and _source added)
      const cachedData = {
        timestamp: Date.now(), // Fresh cache
        data: {
          success: true,
          data: {
            distribution: [{ name: 'Cached', count: 1, percentage: '100' }],
            total: 1,
            updated_at: Date.now(),
          },
        },
      };
      localStorageMock.setItem('au_stats_browsers_10', JSON.stringify(cachedData));

      // Fetch should fail for all retry attempts
      mockFetch.mockImplementation(() => Promise.reject(new Error('Network error')));

      // Need to advance timers for retry backoff
      const resultPromise = getBrowserDistribution(10);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      // When returned from cache, it returns parsed.data which is the full response
      expect(result.data.distribution[0].name).toBe('Cached');
      mockFetch.mockReset();
    });

    it('should ignore stale cache', async () => {
      const staleData = {
        timestamp: Date.now() - 200000, // 200 seconds ago (TTL is 180s)
        data: {
          distribution: [{ name: 'Stale', count: 1, percentage: '100' }],
          total: 1,
        },
      };
      localStorageMock.setItem('au_stats_browsers_10', JSON.stringify(staleData));

      // This time fetch succeeds
      const freshData = {
        success: true,
        data: {
          distribution: [{ name: 'Fresh', count: 2, percentage: '100' }],
          total: 2,
          updated_at: Date.now(),
        },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(freshData),
      });

      const result = await getBrowserDistribution(10);

      expect(result.data.distribution[0].name).toBe('Fresh');
    });
  });
});
