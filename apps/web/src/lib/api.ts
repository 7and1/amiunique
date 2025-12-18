/**
 * API client for AmiUnique.io Worker API
 */

import type { FingerprintData, AnalysisResult, GlobalStats } from '@amiunique/core';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'https://amiunique-api.7and1.workers.dev';

// Short timeout for build-time fetches to prevent static generation hangs
const BUILD_TIMEOUT = 5000;
const RETRY_ATTEMPTS = 2;
const RETRY_BACKOFF = 300; // ms
const CACHE_TTL_MS = 180 * 1000; // 180 seconds for stats payloads

type Cached<T> = {
  timestamp: number;
  data: T;
};

function hasWindow() {
  return typeof window !== 'undefined';
}

function getCache<T>(key: string): T | null {
  if (!hasWindow()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached<T>;
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return Object.assign({}, parsed.data, { _cached: true, _source: 'local-cache' }) as T;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T) {
  if (!hasWindow()) return;
  try {
    const payload: Cached<T> = { timestamp: Date.now(), data };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore quota errors in client environments
  }
}

function deriveSource(response: Response): 'edge-cache' | 'origin' {
  const cacheStatus = response.headers.get('cf-cache-status');
  const age = Number(response.headers.get('age') || '0');
  if ((cacheStatus && cacheStatus.toUpperCase() === 'HIT') || age > 0) return 'edge-cache';
  return 'origin';
}

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = BUILD_TIMEOUT,
  attempts = RETRY_ATTEMPTS
): Promise<Response> {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      lastError = err;
      clearTimeout(timeoutId);
      if (i < attempts - 1) {
        await new Promise(res => setTimeout(res, RETRY_BACKOFF * (i + 1)));
      }
    }
  }

  throw lastError;
}

// Longer timeout for analyze (larger payload, more processing)
const ANALYZE_TIMEOUT = 15000;
const ANALYZE_RETRY_ATTEMPTS = 3;

/**
 * Submit fingerprint for analysis
 * Uses retry logic with exponential backoff for reliability
 */
export async function analyzeFingerprint(data: FingerprintData): Promise<AnalysisResult> {
  const response = await fetchWithTimeout(
    `${API_URL}/api/analyze`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
    ANALYZE_TIMEOUT,
    ANALYZE_RETRY_ATTEMPTS
  );

  if (!response.ok) {
    // Try to get error details from response
    let errorMessage = `API error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.message) {
        errorMessage = errorBody.message;
      } else if (errorBody?.error) {
        errorMessage = errorBody.error;
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Get global statistics
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  const cacheKey = 'au_stats_global';
  try {
    const response = await fetchWithTimeout(`${API_URL}/api/stats`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    const data = Object.assign({}, result.data, { _source: deriveSource(response) }) as GlobalStats & { _source?: string };
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    const cached = getCache<GlobalStats>(cacheKey);
    if (cached) return cached;
    throw error;
  }
}

/**
 * Distribution data item
 */
export interface DistributionItem {
  name?: string;
  code?: string;
  resolution?: string;
  vendor?: string;
  count: number;
  percentage: string;
}

/**
 * Distribution response
 */
export interface DistributionResponse {
  success: boolean;
  data: {
    distribution: DistributionItem[];
    total: number;
    updated_at: number;
  };
}

/**
 * Get browser distribution
 */
export async function getBrowserDistribution(limit = 10): Promise<DistributionResponse> {
  const cacheKey = `au_stats_browsers_${limit}`;
  try {
    const response = await fetchWithTimeout(`${API_URL}/api/stats/browsers?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch browser stats');
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    const cached = getCache<DistributionResponse>(cacheKey);
    if (cached) return cached;
    throw error;
  }
}

/**
 * Get OS distribution
 */
export async function getOSDistribution(limit = 10): Promise<DistributionResponse> {
  const cacheKey = `au_stats_os_${limit}`;
  try {
    const response = await fetchWithTimeout(`${API_URL}/api/stats/os?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch OS stats');
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    const cached = getCache<DistributionResponse>(cacheKey);
    if (cached) return cached;
    throw error;
  }
}

/**
 * Get device distribution
 */
export async function getDeviceDistribution(): Promise<DistributionResponse> {
  const cacheKey = 'au_stats_devices';
  try {
    const response = await fetchWithTimeout(`${API_URL}/api/stats/devices`);
    if (!response.ok) throw new Error('Failed to fetch device stats');
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    const cached = getCache<DistributionResponse>(cacheKey);
    if (cached) return cached;
    throw error;
  }
}

/**
 * Get country distribution
 */
export async function getCountryDistribution(limit = 20): Promise<DistributionResponse> {
  const cacheKey = `au_stats_countries_${limit}`;
  try {
    const response = await fetchWithTimeout(`${API_URL}/api/stats/countries?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch country stats');
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    const cached = getCache<DistributionResponse>(cacheKey);
    if (cached) return cached;
    throw error;
  }
}

/**
 * Get screen distribution
 */
export async function getScreenDistribution(limit = 15): Promise<DistributionResponse> {
  const cacheKey = `au_stats_screens_${limit}`;
  try {
    const response = await fetchWithTimeout(`${API_URL}/api/stats/screens?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch screen stats');
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    const cached = getCache<DistributionResponse>(cacheKey);
    if (cached) return cached;
    throw error;
  }
}

/**
 * Daily trend item
 */
export interface DailyTrendItem {
  date: string;
  total_visits: number;
  unique_devices: number;
}

/**
 * Get daily trends
 */
export async function getDailyTrends(
  days = 30
): Promise<{ trends: DailyTrendItem[]; period_days: number }> {
  const cacheKey = `au_stats_trends_${days}`;
  try {
    const response = await fetchWithTimeout(`${API_URL}/api/stats/daily?days=${days}`);
    if (!response.ok) throw new Error('Failed to fetch daily trends');
    const result = await response.json();
    setCache(cacheKey, result.data);
    return result.data;
  } catch (error) {
    const cached = getCache<{ trends: DailyTrendItem[]; period_days: number }>(cacheKey);
    if (cached) return cached;
    throw error;
  }
}

/**
 * Health check
 */
export async function checkHealth(): Promise<{
  status: string;
  timestamp: number;
  latency_ms: number;
}> {
  const cacheKey = 'au_health';
  try {
    const response = await fetchWithTimeout(`${API_URL}/api/health`, {}, 3000, 1);
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    const cached = getCache<{ status: string; timestamp: number; latency_ms: number }>(cacheKey);
    if (cached) return cached;
    throw error;
  }
}

/**
 * Deletion (opt-out) request payload
 */
export interface DeletionRequestPayload {
  hash_type: 'hardware' | 'software' | 'full';
  hash_value: string;
  email?: string;
  reason?: string;
}

export interface DeletionStatusResponse {
  id: string;
  hash_type?: string;
  status: string;
  created_at: number;
  completed_at?: number | null;
  duplicate?: boolean;
  sla_hours?: number;
}

/**
 * Submit a deletion/opt-out request
 */
export async function submitDeletionRequest(payload: DeletionRequestPayload): Promise<DeletionStatusResponse> {
  const response = await fetch(`${API_URL}/api/deletion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json.success === false) {
    const message = json?.message || `Deletion API error: ${response.status}`;
    throw new Error(message);
  }

  return json.data as DeletionStatusResponse;
}

/**
 * Check deletion status by request id
 */
export async function getDeletionStatus(requestId: string): Promise<DeletionStatusResponse> {
  const response = await fetch(`${API_URL}/api/deletion/${requestId}`);
  const json = await response.json().catch(() => ({}));

  if (!response.ok || json.success === false) {
    throw new Error(json?.message || 'Unable to fetch deletion status');
  }

  return json.data as DeletionStatusResponse;
}
