'use client';

import { useMemo } from 'react';
import { ArrowRight, CheckCircle, AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import type { AnalysisResult } from '@amiunique/core';
import { getPreviousScan, compareWithPrevious, type FingerprintComparison } from '@/lib/history';
import { cn } from '@/lib/utils';

interface FingerprintComparisonPanelProps {
  currentResult: AnalysisResult;
  className?: string;
}

function formatTimeSince(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

const summaryConfig: Record<
  FingerprintComparison['summary'],
  { icon: typeof CheckCircle; label: string; description: string; color: string; bgColor: string }
> = {
  identical: {
    icon: CheckCircle,
    label: 'Identical',
    description: 'Your fingerprint is exactly the same as your previous scan.',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
  },
  minor_changes: {
    icon: AlertTriangle,
    label: 'Minor Changes',
    description: 'Small session-level changes detected (e.g., network, time).',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
  },
  significant_changes: {
    icon: AlertCircle,
    label: 'Significant Changes',
    description: 'Browser configuration changed (e.g., extensions, settings, updates).',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/30',
  },
  device_changed: {
    icon: AlertCircle,
    label: 'Device Changed',
    description: 'Hardware fingerprint differs — likely a different device or major system change.',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/30',
  },
};

export function FingerprintComparisonPanel({ currentResult, className }: FingerprintComparisonPanelProps) {
  const comparison = useMemo(() => {
    const previousScan = getPreviousScan(currentResult.hashes.bronze);
    if (!previousScan) return null;
    return compareWithPrevious(currentResult, previousScan);
  }, [currentResult]);

  if (!comparison) {
    return (
      <div className={cn('rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50', className)}>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Clock className="h-4 w-4" />
          <span>First scan — no previous fingerprint to compare</span>
        </div>
      </div>
    );
  }

  const config = summaryConfig[comparison.summary];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900', className)}>
      <div className="flex items-start gap-4">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', config.bgColor)}>
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className={cn('text-lg font-semibold', config.color)}>{config.label}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{config.description}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            <span>Last scan: {formatTimeSince(comparison.timeSinceLastScan)}</span>
          </div>

          {/* Hash comparison grid */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <HashComparisonRow
              label="Gold Lock"
              sublabel="Hardware"
              changed={comparison.hashesChanged.gold}
              previousHash={comparison.previousScan.hashes.gold}
              currentHash={currentResult.hashes.gold}
            />
            <HashComparisonRow
              label="Silver Lock"
              sublabel="Software"
              changed={comparison.hashesChanged.silver}
              previousHash={comparison.previousScan.hashes.silver}
              currentHash={currentResult.hashes.silver}
            />
            <HashComparisonRow
              label="Bronze Lock"
              sublabel="Session"
              changed={comparison.hashesChanged.bronze}
              previousHash={comparison.previousScan.hashes.bronze}
              currentHash={currentResult.hashes.bronze}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface HashComparisonRowProps {
  label: string;
  sublabel: string;
  changed: boolean;
  previousHash: string;
  currentHash: string;
}

function HashComparisonRow({ label, sublabel, changed, previousHash, currentHash }: HashComparisonRowProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors',
        changed
          ? 'border-orange-200 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-900/20'
          : 'border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs font-medium text-slate-900 dark:text-white">{label}</span>
          <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">({sublabel})</span>
        </div>
        {changed ? (
          <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
            CHANGED
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            SAME
          </span>
        )}
      </div>
      {changed && (
        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400">
          <span className="truncate max-w-[60px]" title={previousHash}>
            {previousHash.slice(0, 8)}…
          </span>
          <ArrowRight className="h-3 w-3 flex-shrink-0" />
          <span className="truncate max-w-[60px] text-orange-600 dark:text-orange-400" title={currentHash}>
            {currentHash.slice(0, 8)}…
          </span>
        </div>
      )}
    </div>
  );
}
