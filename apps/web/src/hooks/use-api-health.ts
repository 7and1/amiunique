'use client';

import { useCallback, useEffect, useState } from 'react';
import { checkHealth } from '@/lib/api';

export type ApiHealth = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms: number;
  timestamp: number;
};

export function useApiHealth(pollMs = 15000) {
  const [data, setData] = useState<ApiHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      setError(null);
      const res = await checkHealth();
      setData({
        status: (res.status as ApiHealth['status']) || 'degraded',
        latency_ms: res.latency_ms,
        timestamp: res.timestamp,
      });
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, pollMs);
    return () => clearInterval(id);
  }, [fetchHealth, pollMs]);

  return { data, loading, error, refresh: fetchHealth };
}
