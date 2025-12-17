'use client';

import { useEffect, useMemo, useState } from 'react';

interface LiveCounterProps {
  baseline: number;
  updatedAt?: number;
  refresh?: () => void;
  refreshIntervalMs?: number;
}

export function LiveCounter({ baseline, updatedAt, refresh, refreshIntervalMs = 60_000 }: LiveCounterProps) {
  const [count, setCount] = useState(baseline);

  useEffect(() => {
    setCount(baseline);
  }, [baseline]);

  // Auto-refresh stats when a refresh callback is provided
  useEffect(() => {
    if (!refresh) return undefined;
    const interval = setInterval(() => refresh(), refreshIntervalMs);
    return () => clearInterval(interval);
  }, [refresh, refreshIntervalMs]);

  const updatedLabel = useMemo(() => {
    if (!updatedAt) return null;
    const minutes = Math.round((updatedAt - Date.now()) / 60000);
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(minutes, 'minute');
  }, [updatedAt]);

  return (
    <div
      className="flex flex-col gap-1 text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
        <p>
          <span className="sr-only">Total fingerprints: </span>
          <span className="font-semibold text-foreground">{count.toLocaleString()}</span>
          <span aria-hidden="true"> fingerprints analyzed</span>
          <span className="sr-only"> fingerprints have been analyzed</span>
        </p>
      </div>
      {updatedLabel && <span className="text-xs">Updated {updatedLabel}</span>}
      {refresh && (
        <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
          Auto-refreshes every {(refreshIntervalMs / 1000).toFixed(0)}s
        </span>
      )}
    </div>
  );
}
