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

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = BUILD_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Submit fingerprint for analysis
 */
export async function analyzeFingerprint(data: FingerprintData): Promise<AnalysisResult> {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get global statistics
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  const response = await fetchWithTimeout(`${API_URL}/api/stats`, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
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
  const response = await fetchWithTimeout(`${API_URL}/api/stats/browsers?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch browser stats');
  return response.json();
}

/**
 * Get OS distribution
 */
export async function getOSDistribution(limit = 10): Promise<DistributionResponse> {
  const response = await fetchWithTimeout(`${API_URL}/api/stats/os?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch OS stats');
  return response.json();
}

/**
 * Get device distribution
 */
export async function getDeviceDistribution(): Promise<DistributionResponse> {
  const response = await fetchWithTimeout(`${API_URL}/api/stats/devices`);
  if (!response.ok) throw new Error('Failed to fetch device stats');
  return response.json();
}

/**
 * Get country distribution
 */
export async function getCountryDistribution(limit = 20): Promise<DistributionResponse> {
  const response = await fetchWithTimeout(`${API_URL}/api/stats/countries?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch country stats');
  return response.json();
}

/**
 * Get screen distribution
 */
export async function getScreenDistribution(limit = 15): Promise<DistributionResponse> {
  const response = await fetchWithTimeout(`${API_URL}/api/stats/screens?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch screen stats');
  return response.json();
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
  const response = await fetchWithTimeout(`${API_URL}/api/stats/daily?days=${days}`);
  if (!response.ok) throw new Error('Failed to fetch daily trends');
  const result = await response.json();
  return result.data;
}

/**
 * Health check
 */
export async function checkHealth(): Promise<{
  status: string;
  timestamp: number;
  latency_ms: number;
}> {
  const response = await fetchWithTimeout(`${API_URL}/api/health`);
  return response.json();
}
