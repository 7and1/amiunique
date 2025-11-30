'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useScanFlow } from '@/lib/scan-flow';

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
  const { phase, progress, error, startScan } = useScanFlow();

  useEffect(() => {
    if (phase === 'idle') {
      startScan().catch(() => {});
    }
  }, [phase, startScan]);

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

          <h1 className="text-2xl font-bold mb-2">{scanStateLabel}</h1>
          <p className="text-muted-foreground mb-8 text-sm sm:text-base">{subtitle}</p>

          {(phase === 'collecting' || phase === 'analyzing' || phase === 'idle') && (
            <div className="mb-6">
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{phase === 'analyzing' ? 'Analyzing fingerprint…' : progress.dimension}</span>
                {progress.total > 0 && (
                  <span>
                    {Math.min(progress.index, progress.total)}/{progress.total}
                  </span>
                )}
              </div>
            </div>
          )}

          {(phase === 'collecting' || phase === 'analyzing' || phase === 'idle') && (
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          )}

          {phase === 'error' && (
            <button
              onClick={() => startScan().catch(() => {})}
              className="mt-4 px-6 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
            >
              Retry Scan
            </button>
          )}

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
