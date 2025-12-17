'use client';

import { cn } from '@/lib/utils';
import type { ApiHealth } from '@/hooks/use-api-health';

interface ApiStatusPillProps {
  health: ApiHealth | null;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function ApiStatusPill({ health, loading, error, onRetry }: ApiStatusPillProps) {
  const status = health?.status ?? (error ? 'unhealthy' : 'degraded');

  const color = {
    healthy: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/20',
    degraded: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/20',
    unhealthy: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:border-rose-500/20',
  }[status];

  const label = loading
    ? 'Checking API…'
    : status === 'healthy'
      ? 'Edge API • Healthy'
      : status === 'degraded'
        ? 'Edge API • Degraded'
        : 'Edge API • Unreachable';

  return (
    <button
      type="button"
      onClick={onRetry}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition hover:opacity-90',
        color
      )}
      aria-label="API health status"
    >
      <span className={cn('h-2.5 w-2.5 rounded-full', {
        'bg-emerald-500': status === 'healthy',
        'bg-amber-500': status === 'degraded',
        'bg-rose-500': status === 'unhealthy',
      })}
      />
      {label}
      {!loading && health?.latency_ms != null && (
        <span className="text-[11px] text-current/80">{health.latency_ms} ms</span>
      )}
    </button>
  );
}
