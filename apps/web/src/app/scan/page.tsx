'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useScanFlow } from '@/lib/scan-flow';
import { CircularProgress } from '@/components/ui/circular-progress';

const DIMENSION_LABELS = [
  'Canvas fingerprint',
  'WebGL renderer',
  'Audio context',
  'Font detection',
  'Screen properties',
  'Hardware info',
  'Media codecs',
  'Browser capabilities',
  'Network metadata',
  'Lie detection sweeps',
];

type IconState = 'error' | 'complete' | 'active';

const stateMeta: Record<IconState, { icon: ReactNode; bg: string }> = {
  error: {
    icon: <AlertCircle className="w-10 h-10 text-red-600" />,
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
  complete: {
    icon: <CheckCircle className="w-10 h-10 text-green-600" />,
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  active: {
    icon: <Shield className="w-10 h-10 text-primary-600" />,
    bg: 'bg-primary-100 dark:bg-primary-900/30',
  },
};

export default function ScanPage() {
  const router = useRouter();
  const { phase, progress, error, startScan, durationMs, mode } = useScanFlow();
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const prefetchedRef = useRef(false);

  const hasStoredResult = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(sessionStorage.getItem('scanResult'));
  }, []);

  // Smart prefetch: Start loading result page when analyzing begins
  useEffect(() => {
    if (phase === 'analyzing' && !prefetchedRef.current) {
      // Prefetch the result page to reduce perceived load time
      router.prefetch('/scan/result');
      prefetchedRef.current = true;
    }
  }, [phase, router]);

  useEffect(() => {
    if (phase === 'idle') {
      startScan(lowBandwidth ? 'lite' : 'full').catch(() => {});
    }
  }, [phase, startScan, lowBandwidth]);

  useEffect(() => {
    if (phase === 'complete') {
      const timer = setTimeout(() => router.push('/scan/result'), 500);
      return () => clearTimeout(timer);
    }
  }, [phase, router]);

  const percent = progress.total > 0
    ? Math.min(100, Math.round(((phase === 'analyzing' ? progress.total : progress.index) / progress.total) * 100))
    : phase === 'analyzing'
      ? 100
      : 0;

  const scanStateLabel = {
    idle: 'Preparing Scan…',
    collecting: 'Scanning Your Browser',
    analyzing: 'Analyzing Fingerprint',
    complete: 'Scan Complete! Redirecting…',
    error: 'Scan Failed',
  }[phase];

  const subtitle = {
    idle: 'Initializing fingerprint collectors',
    collecting: `${progress.dimension}`,
    analyzing: 'Comparing with our database',
    complete: 'Redirecting to results…',
    error: error || 'Unknown error occurred',
  }[phase];

  const iconState: IconState = phase === 'error' ? 'error' : phase === 'complete' ? 'complete' : 'active';

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="text-center">
          <div className="mb-8">
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${stateMeta[iconState].bg} ${
              iconState === 'active' ? 'animate-pulse' : ''
            }`}
            >
              {stateMeta[iconState].icon}
            </div>
          </div>

          {/* Accessible live region for screen readers */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {scanStateLabel}. {subtitle}.
            {progress.total > 0 && ` Step ${Math.min(progress.index + 1, progress.total)} of ${progress.total}.`}
          </div>

          <h1 className="text-2xl font-bold mb-2">{scanStateLabel}</h1>
          <p className="text-muted-foreground mb-8 text-sm sm:text-base">{subtitle}</p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 dark:border-slate-700 dark:bg-slate-800">
              Mode: {lowBandwidth ? 'Lite' : 'Full'}
            </span>
            {durationMs && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 dark:border-slate-700 dark:bg-slate-800">
                Duration: {(durationMs / 1000).toFixed(1)}s
              </span>
            )}
            {lowBandwidth && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                ~40% faster than full scan
              </span>
            )}
          </div>

          {(phase === 'collecting' || phase === 'analyzing' || phase === 'idle') && (
            <div className="mb-6 flex flex-col items-center">
              {/* Circular Progress */}
              <CircularProgress
                value={percent}
                size="lg"
                dimension={phase === 'analyzing' ? 'Analyzing fingerprint…' : progress.dimension}
                showValue={true}
                colorClass={phase === 'analyzing' ? 'stroke-emerald-500' : 'stroke-primary-500'}
              />

              {/* Step counter */}
              {progress.total > 0 && (
                <div className="mt-4 text-sm text-muted-foreground">
                  Step {Math.min(progress.index + 1, progress.total)} of {progress.total}
                </div>
              )}
            </div>
          )}

          {phase === 'error' && (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => startScan(lowBandwidth ? 'lite' : 'full').catch(() => {})}
                className="mt-4 px-6 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
              >
                Retry Scan
              </button>
              <button
                onClick={() => {
                  const payload = { phase, progress, error };
                  navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).catch(() => {});
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Copy Debug Info
              </button>
            </div>
          )}

          {hasStoredResult && (
            <button
              onClick={() => router.push('/scan/result')}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
            >
              Skip to previous results
            </button>
          )}

          <div className="mt-8 inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <input
              id="low-bandwidth"
              type="checkbox"
              checked={lowBandwidth}
              onChange={e => setLowBandwidth(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="low-bandwidth" className="flex flex-col items-start text-left">
              <span className="font-semibold">Lite Mode</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Skip audio, fonts, plugins for faster core fingerprinting</span>
            </label>
          </div>

          {(phase === 'collecting' || phase === 'analyzing') && (
            <div className="mt-8 p-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-left">
              <h3 className="text-sm font-medium mb-3">Collector timeline</h3>
              <div className="space-y-2 text-sm">
                {DIMENSION_LABELS.map((dim, i) => {
                  const doneThreshold = Math.floor(progress.index / 2.5);
                  const isDone = i <= doneThreshold;
                  return (
                    <div key={dim} className={`flex items-center gap-2 transition-opacity ${isDone ? 'opacity-100' : 'opacity-40'}`}>
                      {isDone ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-current" />
                      )}
                      <span>{dim}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
