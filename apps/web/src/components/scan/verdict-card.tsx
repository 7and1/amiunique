'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, History, RefreshCw, Shield } from 'lucide-react';
import type { AnalysisResult } from '@amiunique/core';
import { cn, getRiskBadgeClass } from '@/lib/utils';
import { useCountUp } from '@/hooks/use-count-up';
import { SharePanel } from '@/components/ui/share-panel';

interface VerdictCardProps {
  result: AnalysisResult;
  onScanAgain: () => void;
  onOpenHistory: () => void;
}

const riskCardClasses: Record<AnalysisResult['result']['tracking_risk'], string> = {
  critical: 'border-red-500 bg-red-50 dark:bg-red-950/20',
  high: 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
  medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
  low: 'border-green-500 bg-green-50 dark:bg-green-950/20',
};

const chipTones = {
  emerald:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  amber:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  rose: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
  neutral:
    'border-slate-200 bg-white/60 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300',
} as const;

function bandTone(band: string | null): keyof typeof chipTones {
  const normalized = (band ?? '').toLowerCase();
  if (normalized === 'excellent' || normalized === 'good') return 'emerald';
  if (normalized === 'fair') return 'amber';
  if (normalized === 'poor' || normalized === 'danger') return 'rose';
  return 'neutral';
}

function NetworkChip({
  intel,
  status,
}: {
  intel: AnalysisResult['ip_intel'];
  status: AnalysisResult['ip_intel_status'];
}) {
  if (intel) {
    return (
      <a
        href="#network"
        className={cn(
          'badge-pill normal-case tracking-normal transition hover:opacity-80',
          chipTones[bandTone(intel.band)]
        )}
      >
        {intel.band ?? 'Unrated'} · {intel.ip_score ?? '—'}/100
        {intel.cached && (
          <span className="inline-flex items-center gap-1 text-[10px] opacity-70">
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            cached
          </span>
        )}
      </a>
    );
  }

  if (status === 'pending') {
    return (
      <span
        className={cn(
          'badge-pill normal-case tracking-normal motion-safe:animate-pulse',
          chipTones.neutral
        )}
      >
        Checking network…
      </span>
    );
  }

  return (
    <span className={cn('badge-pill normal-case tracking-normal opacity-70', chipTones.neutral)}>
      Network intel unavailable
    </span>
  );
}

function MetricTile({
  value,
  label,
  caption,
  highlight = false,
}: {
  value: string;
  label: string;
  caption?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl px-2 py-3',
        highlight && 'bg-amber-100/60 ring-1 ring-amber-400/60 dark:bg-amber-500/10'
      )}
    >
      <div
        className={cn(
          'font-mono text-2xl font-bold',
          highlight && 'text-amber-700 dark:text-amber-300'
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      {caption && <div className="mt-0.5 text-[11px] text-muted-foreground/80">{caption}</div>}
    </div>
  );
}

export function VerdictCard({ result, onScanAgain, onOpenHistory }: VerdictCardProps) {
  const analysis = result.result;
  const rarityDenominator =
    analysis.total_fingerprints > 0 && analysis.exact_match_count > 0
      ? Math.max(1, Math.round(analysis.total_fingerprints / analysis.exact_match_count))
      : analysis.total_fingerprints;

  // useCountUp animates on target change, so arm the targets after mount to count 0 → value
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    setArmed(true);
  }, []);

  const exactCount = useCountUp(armed ? analysis.exact_match_count : 0);
  const rarityCount = useCountUp(armed ? rarityDenominator : 0);
  const hardwareCount = useCountUp(armed ? analysis.hardware_match_count : 0);
  const variantCount = useCountUp(armed ? analysis.browser_variant_count : 0);
  const totalCount = useCountUp(armed ? analysis.total_fingerprints : 0);

  return (
    <div
      className={cn(
        'rounded-2xl border-2 p-8 text-center',
        riskCardClasses[analysis.tracking_risk]
      )}
    >
      <div className="mb-4">
        {analysis.is_unique ? (
          <AlertTriangle className="mx-auto h-16 w-16 text-orange-500" aria-hidden="true" />
        ) : analysis.tracking_risk === 'low' ? (
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" aria-hidden="true" />
        ) : (
          <Shield className="mx-auto h-16 w-16 text-primary-500" aria-hidden="true" />
        )}
      </div>

      <h3 className="mb-2 text-2xl font-bold">
        {analysis.is_unique ? 'You Are Unique!' : 'Fingerprint Detected'}
      </h3>

      <p className="mb-4 text-lg">{analysis.message}</p>

      <div className="mb-6 flex items-center justify-center gap-2">
        <span className={getRiskBadgeClass(analysis.tracking_risk)}>
          {analysis.tracking_risk.toUpperCase()} RISK
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3 lg:grid-cols-5">
        <MetricTile
          value={exactCount.toLocaleString()}
          label="Exact matches"
          caption={analysis.uniqueness_display}
        />
        <MetricTile
          value={`1 in ${Math.max(1, rarityCount).toLocaleString()}`}
          label="Rarity"
          caption={`of ${analysis.total_fingerprints.toLocaleString()} fingerprints`}
        />
        <MetricTile value={hardwareCount.toLocaleString()} label="Hardware observations" />
        <MetricTile
          value={variantCount.toLocaleString()}
          label="Browser variants"
          highlight={analysis.browser_variant_count > 1}
        />
        <MetricTile value={totalCount.toLocaleString()} label="Total analyzed" />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <NetworkChip intel={result.ip_intel} status={result.ip_intel_status} />
      </div>

      {analysis.cross_browser_detected && (
        <div className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <AlertTriangle className="mr-2 inline h-4 w-4" aria-hidden="true" />
          This hardware fingerprint has been observed with multiple software fingerprints (
          {analysis.browser_variant_count} browser variants).
        </div>
      )}

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onScanAgain}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Scan again
        </button>
        <button
          type="button"
          onClick={onOpenHistory}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-3 font-medium transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <History className="h-4 w-4" aria-hidden="true" />
          History
        </button>
        <SharePanel result={result} />
      </div>
    </div>
  );
}
