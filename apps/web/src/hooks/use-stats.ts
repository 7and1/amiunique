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
  refresh: () => void;
}

export interface DailyTrendsPayload {
  trends: DailyTrendItem[];
  period_days: number;
}

/**
 * Shared fetch-on-mount state. When `initial` is provided (a build-time
 * snapshot), it renders immediately — including at static export time — and
 * the live fetch upgrades it in the background without flashing a skeleton.
 */
function useFetchedData<T>(fetcher: () => Promise<T>, initial?: T): UseDataResult<T> {
  const [data, setData] = useState<T | null>(initial ?? null);
  const [loading, setLoading] = useState(initial == null);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(() => {
    fetcher()
      .then(result => {
        setData(result);
        setError(null);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [fetcher]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export function useGlobalStats(initial?: GlobalStats): UseDataResult<GlobalStats> {
  return useFetchedData(
    useCallback(() => getGlobalStats(), []),
    initial
  );
}

export function useBrowserDistribution(
  limit = 10,
  initial?: DistributionResponse
): UseDataResult<DistributionResponse> {
  return useFetchedData(
    useCallback(() => getBrowserDistribution(limit), [limit]),
    initial
  );
}

export function useOSDistribution(
  limit = 10,
  initial?: DistributionResponse
): UseDataResult<DistributionResponse> {
  return useFetchedData(
    useCallback(() => getOSDistribution(limit), [limit]),
    initial
  );
}

export function useDeviceDistribution(
  initial?: DistributionResponse
): UseDataResult<DistributionResponse> {
  return useFetchedData(
    useCallback(() => getDeviceDistribution(), []),
    initial
  );
}

export function useCountryDistribution(
  limit = 20,
  initial?: DistributionResponse
): UseDataResult<DistributionResponse> {
  return useFetchedData(
    useCallback(() => getCountryDistribution(limit), [limit]),
    initial
  );
}

export function useScreenDistribution(
  limit = 15,
  initial?: DistributionResponse
): UseDataResult<DistributionResponse> {
  return useFetchedData(
    useCallback(() => getScreenDistribution(limit), [limit]),
    initial
  );
}

export function useDailyTrends(
  days = 30,
  initial?: DailyTrendsPayload
): UseDataResult<DailyTrendsPayload> {
  return useFetchedData(
    useCallback(() => getDailyTrends(days), [days]),
    initial
  );
}

/** Build-time snapshot seeds accepted by the combined page hooks. */
export interface StatsSeed {
  stats?: GlobalStats;
  browsers?: DistributionResponse;
  os?: DistributionResponse;
  devices?: DistributionResponse;
  countries?: DistributionResponse;
  screens?: DistributionResponse;
  trends?: DailyTrendsPayload;
}

/**
 * Combined hook for stats page - fetches all data in parallel
 */
export function useStatsPageData(seed?: StatsSeed) {
  const stats = useGlobalStats(seed?.stats);
  const browsers = useBrowserDistribution(5, seed?.browsers);
  const os = useOSDistribution(5, seed?.os);
  const devices = useDeviceDistribution(seed?.devices);
  const trends = useDailyTrends(7, seed?.trends);

  const loading =
    stats.loading || browsers.loading || os.loading || devices.loading || trends.loading;

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
export function useGlobalDistributionData(seed?: StatsSeed) {
  const stats = useGlobalStats(seed?.stats);
  const browsers = useBrowserDistribution(8, seed?.browsers);
  const os = useOSDistribution(8, seed?.os);
  const countries = useCountryDistribution(10, seed?.countries);
  const screens = useScreenDistribution(10, seed?.screens);
  const devices = useDeviceDistribution(seed?.devices);

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
export function useFingerprintsPageData(seed?: StatsSeed) {
  const stats = useGlobalStats(seed?.stats);
  const trends = useDailyTrends(30, seed?.trends);

  const loading = stats.loading || trends.loading;

  return {
    stats: stats.data,
    trends: trends.data,
    loading,
    error: stats.error || trends.error,
  };
}
