'use client';

import { useEffect, useMemo, useState } from 'react';

interface LiveCounterProps {
  baseline: number;
  updatedAt?: number;
}

export function LiveCounter({ baseline, updatedAt }: LiveCounterProps) {
  const [count, setCount] = useState(baseline);

  useEffect(() => {
    setCount(baseline);
  }, [baseline]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => prev + Math.floor(Math.random() * 5) + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const updatedLabel = useMemo(() => {
    if (!updatedAt) return null;
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.round((updatedAt - Date.now()) / 60000),
      'minute'
    );
  }, [updatedAt]);

  return (
    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden />
        <p>
          <span className="font-semibold text-foreground">{count.toLocaleString()}</span> fingerprints analyzed
        </p>
      </div>
      {updatedLabel && <span className="text-xs">Updated {updatedLabel}</span>}
    </div>
  );
}
