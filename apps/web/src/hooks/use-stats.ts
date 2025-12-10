'use client';

import { useState, useEffect, useCallback } from 'react';
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
export function useGlobalStats(): UseDataResult<GlobalStats> & { refresh: () => void } {
  const [data, setData] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(() => {
    setLoading(true);
    getGlobalStats()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, error, refresh: fetchStats };
}

/**
 * Hook for fetching browser distribution
 */
export function useBrowserDistribution(limit = 10): UseDataResult<DistributionResponse> & { refresh: () => void } {
  const [data, setData] = useState<DistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    getBrowserDistribution(limit)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

/**
 * Hook for fetching OS distribution
 */
export function useOSDistribution(limit = 10): UseDataResult<DistributionResponse> & { refresh: () => void } {
  const [data, setData] = useState<DistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    getOSDistribution(limit)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

/**
 * Hook for fetching device distribution
 */
export function useDeviceDistribution(): UseDataResult<DistributionResponse> & { refresh: () => void } {
  const [data, setData] = useState<DistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    getDeviceDistribution()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

/**
 * Hook for fetching country distribution
 */
export function useCountryDistribution(limit = 20): UseDataResult<DistributionResponse> & { refresh: () => void } {
  const [data, setData] = useState<DistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    getCountryDistribution(limit)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

/**
 * Hook for fetching screen distribution
 */
export function useScreenDistribution(limit = 15): UseDataResult<DistributionResponse> & { refresh: () => void } {
  const [data, setData] = useState<DistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    getScreenDistribution(limit)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

/**
 * Hook for fetching daily trends
 */
export function useDailyTrends(days = 30): UseDataResult<{ trends: DailyTrendItem[]; period_days: number }> & { refresh: () => void } {
  const [data, setData] = useState<{ trends: DailyTrendItem[]; period_days: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    getDailyTrends(days)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
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
    refresh: () => {
      stats.refresh();
      browsers.refresh();
      os.refresh();
      devices.refresh();
      trends.refresh();
    },
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
    refresh: () => {
      stats.refresh();
      browsers.refresh();
      os.refresh();
      countries.refresh();
      screens.refresh();
      devices.refresh();
    },
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
