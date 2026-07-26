'use client';

import type { ReactNode } from 'react';
import { CheckCircle, AlertCircle, Shield, Loader2 } from 'lucide-react';
import { FULL_COLLECTOR_STEPS } from '@amiunique/core';
import { LITE_COLLECTOR_STEPS } from '@/lib/collect-lite';
import { CircularProgress } from '@/components/ui/circular-progress';

type Phase = 'idle' | 'collecting' | 'analyzing' | 'complete' | 'error';

interface ScanProgressProps {
  phase: Phase;
  progress: { dimension: string; index: number; total: number };
  error: string | null;
  mode: 'full' | 'lite';
  durationMs: number | null;
  onRetry: () => void;
}

const stateMeta: Record<'error' | 'active', { icon: ReactNode; bg: string }> = {
  error: {
    icon: <AlertCircle className="h-10 w-10 text-red-600" />,
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
  active: {
    icon: <Shield className="h-10 w-10 text-primary-600" />,
    bg: 'bg-primary-100 dark:bg-primary-900/30',
  },
};

/**
 * Inline scan progress: circular ring + the REAL collector step list
 * (FULL_COLLECTOR_STEPS / LITE_COLLECTOR_STEPS) — no invented timelines.
 */
export function ScanProgress({
  phase,
  progress,
  error,
  mode,
  durationMs,
  onRetry,
}: ScanProgressProps) {
  const steps = mode === 'lite' ? LITE_COLLECTOR_STEPS : FULL_COLLECTOR_STEPS;
  const analyzing = phase === 'analyzing';

  const percent =
    progress.total > 0
      ? Math.min(100, Math.round(((analyzing ? progress.total : progress.index) / progress.total) * 100))
      : analyzing
        ? 100
        : 0;

  const headline = {
    idle: 'Preparing scan…',
    collecting: 'Scanning your browser',
    analyzing: 'Analyzing fingerprint',
    complete: 'Scan complete',
    error: 'Scan failed',
  }[phase];

  const subtitle =
    phase === 'error'
      ? error || 'Unknown error occurred'
      : analyzing
        ? 'Comparing with the live dataset'
        : progress.dimension;

  const iconState = phase === 'error' ? 'error' : 'active';

  return (
    <div className="mx-auto w-full max-w-2xl text-center">
      <div
        className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${stateMeta[iconState].bg} ${
          iconState === 'active' ? 'motion-safe:animate-pulse' : ''
        }`}
      >
        {stateMeta[iconState].icon}
      </div>

      {/* Screen-reader live region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {headline}. {subtitle}.
        {progress.total > 0 &&
          phase === 'collecting' &&
          ` Step ${Math.min(progress.index, progress.total)} of ${progress.total}.`}
      </div>

      <h2 className="mb-1 text-2xl font-bold">{headline}</h2>
      <p className="mb-6 text-sm text-muted-foreground sm:text-base">{subtitle}</p>

      {(phase === 'collecting' || analyzing) && (
        <div className="flex flex-col items-center">
          <CircularProgress
            value={percent}
            size="lg"
            dimension={analyzing ? 'Analyzing fingerprint…' : progress.dimension}
            showValue
            colorClass={analyzing ? 'stroke-emerald-500' : 'stroke-primary-500'}
          />
          {progress.total > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              {analyzing ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" />
                  {progress.total} signals collected — matching against the corpus
                </span>
              ) : (
                <>
                  Step {Math.min(progress.index, progress.total)} of {progress.total}
                </>
              )}
            </div>
          )}

          {/* Real collector checklist: two columns on desktop, hidden on small screens */}
          <div className="mt-8 hidden w-full rounded-2xl border border-white/10 bg-slate-100/60 p-4 text-left dark:bg-slate-800/60 sm:block">
            <h3 className="mb-3 text-sm font-medium">
              Collector timeline · {mode === 'lite' ? 'Lite' : 'Full'} mode
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {steps.map((label, i) => {
                const done = analyzing || progress.index > i + 1;
                const current = !analyzing && progress.index === i + 1;
                return (
                  <div
                    key={label}
                    className={`flex items-center gap-2 transition-opacity ${
                      done || current ? 'opacity-100' : 'opacity-40'
                    }`}
                  >
                    {done ? (
                      <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                    ) : current ? (
                      <Loader2 className="h-4 w-4 shrink-0 text-primary-500 motion-safe:animate-spin" />
                    ) : (
                      <div className="h-4 w-4 shrink-0 rounded-full border-2 border-current" />
                    )}
                    <span className="truncate">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onRetry}
            className="mt-2 rounded-lg bg-primary-600 px-6 py-2 font-medium text-white transition-colors hover:bg-primary-700"
          >
            Retry scan
          </button>
          <button
            onClick={() => {
              const payload = { phase, progress, error };
              navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).catch(() => {});
            }}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Copy debug info
          </button>
        </div>
      )}

      {durationMs !== null && phase === 'complete' && (
        <p className="text-xs text-muted-foreground">Completed in {(durationMs / 1000).toFixed(1)}s</p>
      )}
    </div>
  );
}
