import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleHelp,
  Globe2,
  MapPin,
  Network,
  ShieldCheck,
} from 'lucide-react';
import type { AnalysisDetails, PublicIPIntel } from '@amiunique/core';
import { cn } from '@/lib/utils';

export type NetworkIdentityDetails = Pick<
  AnalysisDetails,
  'net_asn' | 'net_asn_org' | 'net_city' | 'net_region' | 'net_country' | 'net_timezone'
>;

interface NetworkIdentityCardProps {
  intel: PublicIPIntel | null | undefined;
  details: NetworkIdentityDetails;
  /** Reputation lookup still in flight — renders a checking state instead of unavailable */
  pending?: boolean;
  privacyNote?: string;
  unavailableDescription?: string;
}

type RiskTone = 'low' | 'medium' | 'high' | 'unknown';

function getRiskTone(score: number | null): RiskTone {
  if (score === null) return 'unknown';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

const toneStyles: Record<
  RiskTone,
  { label: string; border: string; surface: string; text: string; Icon: typeof ShieldCheck }
> = {
  low: {
    label: 'Low reputation risk',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    surface: 'bg-emerald-50/80 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-300',
    Icon: ShieldCheck,
  },
  medium: {
    label: 'Moderate reputation risk',
    border: 'border-amber-200 dark:border-amber-500/30',
    surface: 'bg-amber-50/80 dark:bg-amber-500/10',
    text: 'text-amber-800 dark:text-amber-300',
    Icon: AlertTriangle,
  },
  high: {
    label: 'High reputation risk',
    border: 'border-rose-200 dark:border-rose-500/30',
    surface: 'bg-rose-50/80 dark:bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-300',
    Icon: AlertTriangle,
  },
  unknown: {
    label: 'Reputation unavailable',
    border: 'border-slate-200 dark:border-slate-700',
    surface: 'bg-slate-50/80 dark:bg-slate-800/50',
    text: 'text-slate-600 dark:text-slate-300',
    Icon: CircleHelp,
  },
};

function formatLocation(details: NetworkIdentityDetails): string {
  const parts = [details.net_city, details.net_region, details.net_country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Location unavailable';
}

function formatNetwork(intel: PublicIPIntel, details: NetworkIdentityDetails): string {
  const asn = intel.asn ?? details.net_asn;
  const organization = intel.operator ?? intel.asn_org ?? details.net_asn_org;
  if (asn && organization) return `AS${asn} · ${organization}`;
  if (asn) return `AS${asn}`;
  return organization || 'Network operator unavailable';
}

export function NetworkIdentityCard({
  intel,
  details,
  pending = false,
  privacyNote = 'No raw IP address is shown.',
  unavailableDescription = 'Your fingerprint scan completed, but the optional reputation provider did not return data. This is an unknown state, not a clean or risky verdict.',
}: NetworkIdentityCardProps) {
  if (!intel && pending) {
    return (
      <section
        className="frosted-card"
        aria-labelledby="network-reputation-heading"
        aria-busy="true"
      >
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-500 motion-safe:animate-pulse dark:bg-indigo-500/10 dark:text-indigo-300">
            <Network className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Network layer
            </p>
            <h2 id="network-reputation-heading" className="mt-1 text-xl font-semibold">
              Checking network reputation…
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              The reputation lookup is still in flight. Results will appear here without re-running
              the scan. {privacyNote}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!intel) {
    return (
      <section className="frosted-card" aria-labelledby="network-reputation-heading">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <Network className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Network layer
            </p>
            <h2 id="network-reputation-heading" className="mt-1 text-xl font-semibold">
              Network intelligence unavailable
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {unavailableDescription}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const tone = getRiskTone(intel.risk_score);
  const toneStyle = toneStyles[tone];
  const ToneIcon = toneStyle.Icon;
  const signals = [
    intel.is_proxy === null
      ? null
      : {
          label: intel.is_proxy ? 'Proxy detected' : 'No proxy signal',
          flagged: intel.is_proxy,
        },
    intel.is_datacenter === null
      ? null
      : {
          label: intel.is_datacenter ? 'Datacenter network' : 'Non-datacenter network',
          flagged: intel.is_datacenter,
        },
    intel.usage_type ? { label: intel.usage_type.replace(/_/g, ' '), flagged: false } : null,
    intel.threat_level
      ? {
          label: `Threat: ${intel.threat_level.replace(/_/g, ' ')}`,
          flagged: intel.threat_level !== 'none' && intel.threat_level !== 'low',
        }
      : null,
  ].filter((signal): signal is { label: string; flagged: boolean } => signal !== null);

  return (
    <section className="frosted-card" aria-labelledby="network-reputation-heading">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <div
          className={cn(
            'flex min-w-0 flex-1 items-start gap-4 rounded-2xl border p-5',
            toneStyle.border,
            toneStyle.surface
          )}
        >
          <div className={cn('rounded-xl bg-white/70 p-2.5 dark:bg-slate-950/40', toneStyle.text)}>
            <ToneIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Network reputation
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className={cn('font-mono text-4xl font-semibold', toneStyle.text)}>
                {intel.risk_score ?? '—'}
              </span>
              <span className="text-sm text-muted-foreground">risk score / 100</span>
            </div>
            <h2 id="network-reputation-heading" className="mt-2 text-lg font-semibold">
              {toneStyle.label}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Reputation describes how this network is classified. It does not measure how anonymous
              you are.
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1 lg:border-l lg:border-slate-200 lg:pl-6 dark:lg:border-slate-700">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Connection identity
          </p>
          <div className="mt-3 space-y-3">
            <div className="flex items-start gap-3">
              <Building2
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="min-w-0 break-words text-sm font-medium">
                {formatNetwork(intel, details)}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-sm">{formatLocation(details)}</span>
            </div>
            {details.net_timezone && (
              <div className="flex items-start gap-3">
                <Globe2
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="text-sm">{details.net_timezone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {signals.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
          {signals.map(signal => (
            <span
              key={signal.label}
              className={cn(
                'badge-pill normal-case tracking-normal',
                signal.flagged
                  ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                  : 'border-slate-200 bg-white/60 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300'
              )}
            >
              {signal.flagged ? (
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {signal.label}
            </span>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        Reputation and network classification are provided by IPBot. Connection location comes from
        Cloudflare edge metadata. {privacyNote}
      </p>
    </section>
  );
}
