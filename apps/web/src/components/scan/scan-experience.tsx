'use client';

import { useEffect, useState } from 'react';
import type { AnalysisResult } from '@amiunique/core';
import { History, RotateCcw } from 'lucide-react';
import { useScanFlow } from '@/lib/scan-flow';
import { ScanProgress } from './scan-progress';
import { ResultDashboard } from './result-dashboard';
import { ScanHistoryDrawer } from './scan-history-drawer';
import { SectionNav } from '@/components/home/section-nav';

const RESULT_SECTIONS = [
  { id: 'verdict', label: 'Verdict' },
  { id: 'network', label: 'Network' },
  { id: 'hashes', label: 'Hashes' },
  { id: 'consistency', label: 'Checks' },
  { id: 'dimensions', label: 'Dimensions' },
  { id: 'learn', label: 'Learn' },
];

interface ScanExperienceProps {
  /** Live result or a result restored from sessionStorage */
  activeResult: AnalysisResult | null;
  /** True when activeResult came from storage, not this session's scan */
  isRestored: boolean;
}

/**
 * Inline scan orchestration for the single-page flow: Lite toggle while idle,
 * real progress while scanning, full dashboard once a result exists.
 * Scans NEVER start without an explicit click.
 */
export function ScanExperience({ activeResult, isRestored }: ScanExperienceProps) {
  const { phase, progress, error, startScan, mode, preferredMode, setPreferredMode, durationMs } =
    useScanFlow();
  const [historyOpen, setHistoryOpen] = useState(false);

  const scanningOrFailed = phase === 'collecting' || phase === 'analyzing' || phase === 'error';
  const showDashboard = activeResult !== null && !scanningOrFailed;

  // Open the history drawer / jump to the scan area for deep links
  // (?history=1 from the /scan/history stub, #scan from the header).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('history') === '1') setHistoryOpen(true);
    if (params.get('scan') === '1' || window.location.hash === '#scan') {
      document.getElementById('scan')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'start',
      });
    }
  }, []);

  // Move focus to the result heading when a fresh scan completes.
  useEffect(() => {
    if (phase === 'complete') {
      document.getElementById('result-heading')?.focus({ preventScroll: true });
      document.getElementById('verdict')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'start',
      });
    }
  }, [phase]);

  const handleScanAgain = () => {
    startScan().catch(() => {});
    document.getElementById('scan')?.scrollIntoView({ block: 'start' });
  };

  return (
    <>
      {phase === 'idle' && !activeResult && (
        <div className="container mx-auto flex justify-center px-4 pb-10">
          <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              checked={preferredMode === 'lite'}
              onChange={e => setPreferredMode(e.target.checked ? 'lite' : 'full')}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="flex flex-col items-start text-left">
              <span className="font-semibold">Lite mode</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Skip audio, fonts and plugin probes for a faster core scan
              </span>
            </span>
          </label>
        </div>
      )}

      {scanningOrFailed && (
        <div id="scan-live" className="container mx-auto scroll-mt-24 px-4 py-12">
          <ScanProgress
            phase={phase}
            progress={progress}
            error={error}
            mode={mode}
            durationMs={durationMs}
            onRetry={() => startScan().catch(() => {})}
          />
        </div>
      )}

      {showDashboard && (
        <div className="container mx-auto px-4 pb-16">
          <SectionNav sections={RESULT_SECTIONS} visible />
          {isRestored && (
            <div className="mx-auto mb-6 flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
              <span className="inline-flex items-center gap-2">
                <History className="h-4 w-4 shrink-0" />
                Restored from your last scan in this session.
              </span>
              <button
                type="button"
                onClick={handleScanAgain}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Run a new scan
              </button>
            </div>
          )}
          <ResultDashboard
            result={activeResult}
            onScanAgain={handleScanAgain}
            onOpenHistory={() => setHistoryOpen(true)}
          />
        </div>
      )}

      <ScanHistoryDrawer open={historyOpen} onOpenChange={setHistoryOpen} />
    </>
  );
}
