'use client';

import { useState, useEffect } from 'react';
import {
  getGlobalStats,
  getBrowserDistribution,
  getOSDistribution,
  getDeviceDistribution,
  getCountryDistribution,
  getScreenDistribution,
  getDailyTrends,
  type DistributionResponse,
  type DailyTrendItem,
} from '@/lib/api';
import type { GlobalStats } from '@amiunique/core';

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for fetching global stats
 */
export function useGlobalStats(): UseDataResult<GlobalStats> {
  const [data, setData] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getGlobalStats()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

/**
 * Hook for fetching browser distribution
 */
export function useBrowserDistribution(limit = 10): UseDataResult<DistributionResponse> {
  const [data, setData] = useState<DistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getBrowserDistribution(limit)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [limit]);

  return { data, loading, error };
}

/**
 * Hook for fetching OS distribution
 */
export function useOSDistribution(limit = 10): UseDataResult<DistributionResponse> {
  const [data, setData] = useState<DistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getOSDistribution(limit)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [limit]);

  return { data, loading, error };
}

/**
 * Hook for fetching device distribution
 */
export function useDeviceDistribution(): UseDataResult<DistributionResponse> {
  const [data, setData] = useState<DistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getDeviceDistribution()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

/**
 * Hook for fetching country distribution
 */
export function useCountryDistribution(limit = 20): UseDataResult<DistributionResponse> {
  const [data, setData] = useState<DistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getCountryDistribution(limit)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [limit]);

  return { data, loading, error };
}

/**
 * Hook for fetching screen distribution
 */
export function useScreenDistribution(limit = 15): UseDataResult<DistributionResponse> {
  const [data, setData] = useState<DistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getScreenDistribution(limit)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [limit]);

  return { data, loading, error };
}

/**
 * Hook for fetching daily trends
 */
export function useDailyTrends(days = 30): UseDataResult<{ trends: DailyTrendItem[]; period_days: number }> {
  const [data, setData] = useState<{ trends: DailyTrendItem[]; period_days: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getDailyTrends(days)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [days]);

  return { data, loading, error };
}

/**
 * Combined hook for stats page - fetches all data in parallel
 */
export function useStatsPageData() {
  const stats = useGlobalStats();
  const browsers = useBrowserDistribution(5);
  const os = useOSDistribution(5);
  const devices = useDeviceDistribution();
  const trends = useDailyTrends(7);

  const loading = stats.loading || browsers.loading || os.loading || devices.loading || trends.loading;

  return {
    stats: stats.data,
    browsers: browsers.data,
    os: os.data,
    devices: devices.data,
    trends: trends.data,
    loading,
    error: stats.error || browsers.error || os.error || devices.error || trends.error,
  };
}

/**
 * Combined hook for global distribution page
 */
export function useGlobalDistributionData() {
  const stats = useGlobalStats();
  const browsers = useBrowserDistribution(8);
  const os = useOSDistribution(8);
  const countries = useCountryDistribution(10);
  const screens = useScreenDistribution(10);
  const devices = useDeviceDistribution();

  const loading =
    stats.loading ||
    browsers.loading ||
    os.loading ||
    countries.loading ||
    screens.loading ||
    devices.loading;

  return {
    stats: stats.data,
    browsers: browsers.data,
    os: os.data,
    countries: countries.data,
    screens: screens.data,
    devices: devices.data,
    loading,
    error:
      stats.error ||
      browsers.error ||
      os.error ||
      countries.error ||
      screens.error ||
      devices.error,
  };
}

/**
 * Combined hook for fingerprints page
 */
export function useFingerprintsPageData() {
  const stats = useGlobalStats();
  const trends = useDailyTrends(30);

  const loading = stats.loading || trends.loading;

  return {
    stats: stats.data,
    trends: trends.data,
    loading,
    error: stats.error || trends.error,
  };
}
