'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Clipboard,
  Eye,
  EyeOff,
  Globe2,
  MapPin,
  RefreshCw,
  Router,
  ShieldCheck,
} from 'lucide-react';
import type { SelfIPIntelReport } from '@amiunique/core';
import { NetworkIdentityCard } from '@/components/scan/network-identity-card';
import { Button } from '@/components/ui/button';
import { getSelfIPIntel, IPIntelRequestError } from '@/lib/api';
import { cn } from '@/lib/utils';

interface IPReportResultProps {
  report: SelfIPIntelReport;
  revealed: boolean;
  copied?: boolean;
  refreshing?: boolean;
  refreshError?: string | null;
  onToggleReveal?: () => void;
  onCopy?: () => void;
  onRefresh?: () => void;
}

function formatCheckedAt(timestamp: number): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

function formatAsn(report: SelfIPIntelReport): string {
  const { asn, asn_org: organization } = report.network;
  if (asn && organization) return `AS${asn} · ${organization}`;
  if (asn) return `AS${asn}`;
  return organization || 'Not available';
}

function formatLocation(report: SelfIPIntelReport): string {
  const { city, region, country } = report.network;
  const location = [city, region, country].filter(Boolean);
  return location.length > 0 ? location.join(', ') : 'Not available';
}

function reportErrorMessage(error: unknown): string {
  if (error instanceof IPIntelRequestError) {
    if (error.status === 429) {
      const wait = error.retryAfter ? ` Try again in about ${error.retryAfter} seconds.` : '';
      return `Too many connection checks.${wait}`;
    }
    return error.message;
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return 'The connection check took too long. Please try again.';
  }
  return 'We could not inspect this connection. Please try again.';
}

export function IPReportResult({
  report,
  revealed,
  copied = false,
  refreshing = false,
  refreshError,
  onToggleReveal,
  onCopy,
  onRefresh,
}: IPReportResultProps) {
  const displayedAddress = revealed ? report.address : report.masked_address;
  const details = {
    net_asn: report.network.asn ?? undefined,
    net_asn_org: report.network.asn_org ?? undefined,
    net_city: report.network.city ?? undefined,
    net_region: report.network.region ?? undefined,
    net_country: report.network.country ?? undefined,
    net_timezone: report.network.timezone ?? undefined,
  };

  return (
    <div className="space-y-6">
      {refreshError && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        >
          {refreshError} Your previous result is still shown.
        </div>
      )}

      <section
        className="glass-panel overflow-hidden p-5 sm:p-7"
        aria-labelledby="current-ip-heading"
        aria-busy={refreshing}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Current connection
            </p>
            <h2 id="current-ip-heading" className="mt-2 text-xl font-semibold">
              The IP address websites can see
            </h2>
            <output
              id="current-ip-value"
              className="mt-5 block break-all font-mono text-2xl font-semibold tracking-tight sm:text-4xl"
              aria-live="polite"
            >
              {displayedAddress}
            </output>
            <p className="mt-2 text-sm text-muted-foreground">
              {report.ip_version.toUpperCase()} · hidden by default on this page
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
            <Button
              type="button"
              variant="outline"
              aria-controls="current-ip-value"
              aria-pressed={revealed}
              onClick={onToggleReveal}
            >
              {revealed ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
              {revealed ? 'Hide full IP' : 'Show full IP'}
            </Button>
            <Button type="button" variant="outline" onClick={onCopy}>
              {copied ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Clipboard className="h-4 w-4" aria-hidden="true" />
              )}
              {copied ? 'Copied' : 'Copy full IP'}
            </Button>
            <Button type="button" variant="ghost" disabled={refreshing} onClick={onRefresh}>
              <RefreshCw
                className={cn('h-4 w-4', refreshing && 'animate-spin')}
                aria-hidden="true"
              />
              {refreshing ? 'Checking' : 'Refresh'}
            </Button>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {copied ? 'Full IP address copied to the clipboard.' : ''}
        </p>

        <dl className="mt-7 grid gap-x-8 gap-y-5 border-t border-white/40 pt-6 sm:grid-cols-2 dark:border-white/10">
          <div>
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <Router className="h-4 w-4" aria-hidden="true" />
              Network operator
            </dt>
            <dd className="mt-1.5 break-words text-sm font-medium">{formatAsn(report)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Approximate location
            </dt>
            <dd className="mt-1.5 text-sm font-medium">{formatLocation(report)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <Globe2 className="h-4 w-4" aria-hidden="true" />
              Edge and timezone
            </dt>
            <dd className="mt-1.5 text-sm font-medium">
              {[report.network.colo, report.network.timezone].filter(Boolean).join(' · ') ||
                'Not available'}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Reputation status
            </dt>
            <dd className="mt-1.5 text-sm font-medium">
              {report.intelligence_status === 'available'
                ? 'Provider classification available'
                : 'Provider classification unavailable'}
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-xs leading-5 text-muted-foreground">
          Checked {formatCheckedAt(report.checked_at)}. The full address is returned only to this
          browser for this live report. AmiUnique does not write it to fingerprint history or Web
          Storage.
        </p>
      </section>

      <NetworkIdentityCard
        intel={report.intelligence}
        details={details}
        privacyNote="The address stays hidden in this report until you choose to reveal it."
        unavailableDescription="Your connection facts are available above, but the optional reputation provider did not return a classification. This is an unknown state, not a clean or risky verdict."
      />
    </div>
  );
}

function LoadingReport() {
  return (
    <section
      className="glass-panel p-5 sm:p-7"
      aria-labelledby="current-ip-heading"
      aria-busy="true"
    >
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
        Current connection
      </p>
      <h2 id="current-ip-heading" className="mt-2 text-xl font-semibold">
        Checking the IP address websites can see
      </h2>
      <div className="mt-6 h-11 w-full max-w-md animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      <p className="mt-4 text-sm text-muted-foreground" role="status">
        Reading first-party edge metadata and optional network reputation…
      </p>
    </section>
  );
}

export function IPReport() {
  const [report, setReport] = useState<SelfIPIntelReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);
  const requestSequence = useRef(0);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadReport = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    setError(null);

    try {
      const nextReport = await getSelfIPIntel();
      if (requestId !== requestSequence.current) return;
      setReport(nextReport);
      setRevealed(false);
      setCopied(false);
    } catch (requestError) {
      if (requestId !== requestSequence.current) return;
      setError(reportErrorMessage(requestError));
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void loadReport();
  }, [loadReport]);

  useEffect(
    () => () => {
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    },
    []
  );

  const copyAddress = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.address);
      setCopied(true);
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
      copyResetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Clipboard access was blocked. Reveal the address and copy it manually.');
    }
  };

  if (!report && loading) return <LoadingReport />;

  if (!report) {
    return (
      <section
        className="glass-panel p-5 sm:p-7"
        aria-labelledby="ip-report-error-heading"
        role="alert"
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">
          Connection check unavailable
        </p>
        <h2 id="ip-report-error-heading" className="mt-2 text-xl font-semibold">
          We could not read this connection
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{error}</p>
        <Button className="mt-5" type="button" onClick={() => void loadReport()}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry IP report
        </Button>
      </section>
    );
  }

  return (
    <IPReportResult
      report={report}
      revealed={revealed}
      copied={copied}
      refreshing={loading}
      refreshError={error}
      onToggleReveal={() => setRevealed(value => !value)}
      onCopy={() => void copyAddress()}
      onRefresh={() => void loadReport()}
    />
  );
}
