/**
 * Unit tests for scan history management
 * Tests localStorage-based history storage and comparison
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  readHistory,
  saveToHistory,
  clearHistory,
  getPreviousScan,
  compareWithPrevious,
  type ScanHistoryEntry,
} from '../lib/history';

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
    get store() {
      return store;
    },
  };
})();

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Sample analysis result
const createMockResult = (overrides: Partial<any> = {}) => ({
  success: true,
  meta: { id: 'visit-123', timestamp: Date.now(), processing_time_ms: 50 },
  hashes: {
    gold: 'goldhash123',
    silver: 'silverhash456',
    bronze: 'bronzehash789',
    ...overrides.hashes,
  },
  result: {
    is_unique: true,
    uniqueness_ratio: 1,
    uniqueness_display: '1 in 1',
    exact_match_count: 1,
    hardware_match_count: 1,
    total_fingerprints: 1000,
    tracking_risk: 'high' as const,
    message: 'Unique fingerprint',
    cross_browser_detected: false,
    ...overrides.result,
  },
  details: {
    sys_user_agent: 'Mozilla/5.0 Chrome/120',
    sys_platform: 'Win32',
    ...overrides.details,
  },
  lies: {},
  ...overrides,
});

describe('history', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('readHistory', () => {
    it('should return empty array when no history exists', () => {
      const history = readHistory();
      expect(history).toEqual([]);
    });

    it('should return parsed history from localStorage', () => {
      const entries: ScanHistoryEntry[] = [
        {
          id: 'hash1',
          createdAt: Date.now(),
          uniqueness: '1 in 1',
          trackingRisk: 'high',
          message: 'Unique',
          hashes: { gold: 'g1', silver: 's1', bronze: 'b1' },
        },
      ];
      localStorageMock.setItem('scanHistory', JSON.stringify(entries));

      const history = readHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('hash1');
    });

    it('should return empty array on invalid JSON', () => {
      localStorageMock.setItem('scanHistory', 'invalid json{');
      const history = readHistory();
      expect(history).toEqual([]);
    });

    it('should return empty array if stored value is not an array', () => {
      localStorageMock.setItem('scanHistory', JSON.stringify({ not: 'array' }));
      const history = readHistory();
      expect(history).toEqual([]);
    });
  });

  describe('saveToHistory', () => {
    it('should save result to localStorage', () => {
      const result = createMockResult();
      saveToHistory(result);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'scanHistory',
        expect.any(String)
      );

      const saved = JSON.parse(localStorageMock.store['scanHistory']);
      expect(saved).toHaveLength(1);
      expect(saved[0].hashes.gold).toBe('goldhash123');
    });

    it('should prepend new entry to existing history', () => {
      // First save
      saveToHistory(createMockResult({ hashes: { bronze: 'first' } }));

      // Second save
      saveToHistory(createMockResult({ hashes: { bronze: 'second' } }));

      const saved = JSON.parse(localStorageMock.store['scanHistory']);
      expect(saved).toHaveLength(2);
      expect(saved[0].id).toBe('second'); // Most recent first
      expect(saved[1].id).toBe('first');
    });

    it('should deduplicate entries with same bronze hash', () => {
      saveToHistory(createMockResult({ hashes: { bronze: 'same' } }));
      saveToHistory(createMockResult({ hashes: { bronze: 'same' } }));

      const saved = JSON.parse(localStorageMock.store['scanHistory']);
      expect(saved).toHaveLength(1);
    });

    it('should limit history to MAX_HISTORY (20) entries', () => {
      // Save 25 entries
      for (let i = 0; i < 25; i++) {
        saveToHistory(createMockResult({
          hashes: { bronze: `hash${i}`, gold: 'g', silver: 's' },
        }));
      }

      const saved = JSON.parse(localStorageMock.store['scanHistory']);
      expect(saved).toHaveLength(20);
      // Most recent should be hash24
      expect(saved[0].id).toBe('hash24');
    });

    it('should extract browser and OS from details', () => {
      saveToHistory(createMockResult({
        details: {
          sys_user_agent: 'Mozilla/5.0 Firefox/120',
          sys_platform: 'MacIntel',
        },
      }));

      const saved = JSON.parse(localStorageMock.store['scanHistory']);
      expect(saved[0].browser).toBe('Mozilla/5.0 Firefox/120');
      expect(saved[0].os).toBe('MacIntel');
    });
  });

  describe('clearHistory', () => {
    it('should remove history from localStorage', () => {
      localStorageMock.setItem('scanHistory', '[]');
      clearHistory();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('scanHistory');
    });
  });

  describe('getPreviousScan', () => {
    it('should return null when no history', () => {
      const previous = getPreviousScan('current-hash');
      expect(previous).toBeNull();
    });

    it('should return null when only current scan in history', () => {
      const entries: ScanHistoryEntry[] = [
        {
          id: 'current-hash',
          createdAt: Date.now(),
          uniqueness: '1 in 1',
          trackingRisk: 'high',
          message: 'Unique',
          hashes: { gold: 'g', silver: 's', bronze: 'current-hash' },
        },
      ];
      localStorageMock.setItem('scanHistory', JSON.stringify(entries));

      const previous = getPreviousScan('current-hash');
      expect(previous).toBeNull();
    });

    it('should return previous scan excluding current', () => {
      const entries: ScanHistoryEntry[] = [
        {
          id: 'current-hash',
          createdAt: Date.now(),
          uniqueness: '1 in 1',
          trackingRisk: 'high',
          message: 'Current',
          hashes: { gold: 'g1', silver: 's1', bronze: 'current-hash' },
        },
        {
          id: 'previous-hash',
          createdAt: Date.now() - 3600000,
          uniqueness: '1 in 5',
          trackingRisk: 'medium',
          message: 'Previous',
          hashes: { gold: 'g2', silver: 's2', bronze: 'previous-hash' },
        },
      ];
      localStorageMock.setItem('scanHistory', JSON.stringify(entries));

      const previous = getPreviousScan('current-hash');
      expect(previous).not.toBeNull();
      expect(previous?.id).toBe('previous-hash');
    });
  });

  describe('compareWithPrevious', () => {
    const previousScan: ScanHistoryEntry = {
      id: 'prev-bronze',
      createdAt: Date.now() - 3600000, // 1 hour ago
      uniqueness: '1 in 5',
      trackingRisk: 'medium',
      message: 'Previous scan',
      hashes: {
        gold: 'prev-gold',
        silver: 'prev-silver',
        bronze: 'prev-bronze',
      },
    };

    it('should detect identical fingerprint', () => {
      const current = createMockResult({
        hashes: {
          gold: 'prev-gold',
          silver: 'prev-silver',
          bronze: 'prev-bronze',
        },
      });

      const comparison = compareWithPrevious(current, previousScan);

      expect(comparison.hashesChanged.gold).toBe(false);
      expect(comparison.hashesChanged.silver).toBe(false);
      expect(comparison.hashesChanged.bronze).toBe(false);
      expect(comparison.summary).toBe('identical');
    });

    it('should detect minor changes (bronze only)', () => {
      const current = createMockResult({
        hashes: {
          gold: 'prev-gold',
          silver: 'prev-silver',
          bronze: 'new-bronze', // Only bronze changed
        },
      });

      const comparison = compareWithPrevious(current, previousScan);

      expect(comparison.hashesChanged.gold).toBe(false);
      expect(comparison.hashesChanged.silver).toBe(false);
      expect(comparison.hashesChanged.bronze).toBe(true);
      expect(comparison.summary).toBe('minor_changes');
    });

    it('should detect significant changes (silver changed)', () => {
      const current = createMockResult({
        hashes: {
          gold: 'prev-gold',
          silver: 'new-silver', // Silver changed
          bronze: 'new-bronze',
        },
      });

      const comparison = compareWithPrevious(current, previousScan);

      expect(comparison.hashesChanged.gold).toBe(false);
      expect(comparison.hashesChanged.silver).toBe(true);
      expect(comparison.hashesChanged.bronze).toBe(true);
      expect(comparison.summary).toBe('significant_changes');
    });

    it('should detect device changed (gold changed)', () => {
      const current = createMockResult({
        hashes: {
          gold: 'new-gold', // Gold changed = different device
          silver: 'new-silver',
          bronze: 'new-bronze',
        },
      });

      const comparison = compareWithPrevious(current, previousScan);

      expect(comparison.hashesChanged.gold).toBe(true);
      expect(comparison.hashesChanged.silver).toBe(true);
      expect(comparison.hashesChanged.bronze).toBe(true);
      expect(comparison.summary).toBe('device_changed');
    });

    it('should calculate time since last scan', () => {
      const oneHourAgo = Date.now() - 3600000;
      const previous: ScanHistoryEntry = {
        ...previousScan,
        createdAt: oneHourAgo,
      };

      const current = createMockResult();
      const comparison = compareWithPrevious(current, previous);

      // Should be approximately 1 hour (3600000 ms)
      expect(comparison.timeSinceLastScan).toBeGreaterThan(3599000);
      expect(comparison.timeSinceLastScan).toBeLessThan(3601000);
    });

    it('should include previous scan in result', () => {
      const current = createMockResult();
      const comparison = compareWithPrevious(current, previousScan);

      expect(comparison.previousScan).toBe(previousScan);
    });
  });
});
