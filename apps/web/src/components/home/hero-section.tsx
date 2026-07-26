'use client';

import Link from 'next/link';
import { ArrowRight, Layout, Lock, Sparkles } from 'lucide-react';
import { ScanButton } from '@/components/home/scan-button';
import { IdentityBellCurve } from '@/components/home/identity-bell-curve';
import { LiveCounter } from '@/components/home/live-counter';
import { useGlobalStats } from '@/hooks/use-stats';
import { snapshotGlobal } from '@/lib/stats-seed';
import { Skeleton } from '@/components/ui/skeleton';

const pillars = [
  {
    title: 'Transparency',
    description:
      'Glassmorphism + gradient borders signal that every collector is documented and user controllable.',
  },
  {
    title: 'Distribution',
    description:
      'Bell curve-first storytelling shows whether your fingerprint hides in the crowd or glows on the edge.',
  },
  {
    title: 'Cleanliness',
    description:
      'Spacious typography, Geist Sans + Mono, and a monochrome palette keep focus on the data.',
  },
];

const lockSummary = [
  {
    lock: 'Gold (Hardware)',
    body: 'Canvas, AudioContext, HDR gamut, motion sensors',
    color: 'text-amber-400',
  },
  {
    lock: 'Silver (Software)',
    body: 'Fonts hash, Intl stack, UA & Accept headers',
    color: 'text-slate-400',
  },
  {
    lock: 'Bronze (Network)',
    body: 'ASN, TLS cipher, CF colo, RTT, cf-ray risk',
    color: 'text-orange-400',
  },
];

function StatCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/30 bg-white/80 p-4 shadow-card dark:border-white/5 dark:bg-white/5"
        >
          <Skeleton className="h-3 w-28 mb-2" />
          <Skeleton className="h-7 w-20" />
        </div>
      ))}
    </div>
  );
}

interface HeroSectionProps {
  /** Forwarded to ScanButton — the orchestrator scrolls to the inline #scan section */
  onScanRequest?: () => void;
}

export function HeroSection({ onScanRequest }: HeroSectionProps) {
  // Seeded with the build-time snapshot so the static HTML carries real corpus
  // numbers; the live fetch upgrades them right after hydration.
  const { data: stats, loading, error, refresh } = useGlobalStats(snapshotGlobal);
  const isCached = Boolean((stats as any)?._cached);

  const totalFingerprints = stats?.total_fingerprints ?? 0;
  const uniqueSessions = stats?.unique_sessions ?? 0;
  const uniqueDevices = stats?.unique_devices ?? 0;
  const corpusLabel = totalFingerprints > 0 ? totalFingerprints.toLocaleString() : '—';
  const rarityBase =
    stats && uniqueSessions > 0 ? Math.max(1, Math.round(totalFingerprints / uniqueSessions)) : 0;
  const percentile =
    stats && totalFingerprints > 0
      ? Math.min(99.99, Math.max(5, 100 - (uniqueSessions / totalFingerprints) * 100))
      : 50;
  const rarityLabel = stats && rarityBase ? `1 in ${rarityBase.toLocaleString()}` : '—';
  const verdict =
    percentile > 95
      ? 'Extremely unique distribution'
      : percentile > 80
        ? 'Highly distinctive across our dataset'
        : 'Close to the crowd average';
  const statCards = [
    { label: 'Fingerprints collected', value: totalFingerprints },
    { label: 'Unique sessions', value: uniqueSessions },
    { label: 'Unique devices', value: uniqueDevices },
  ];

  return (
    <>
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/40 to-transparent dark:from-slate-900 dark:via-slate-900/70" />
        <div className="container relative mx-auto grid gap-12 px-4 lg:grid-cols-[1.05fr_0.85fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-white/70 px-4 py-1 text-sm text-indigo-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-indigo-200">
              <Sparkles className="h-4 w-4" /> Neo-SaaS experience • 80+ dimensions
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
                Are you unique on the web?
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
                AmiUnique.io quantifies how identifiable your browser is against a live corpus of{' '}
                <span className="font-semibold text-foreground">{corpusLabel}</span> fingerprints.
                The Neo-SaaS interface blends transparency, statistical storytelling, and
                privacy-first messaging so users understand every signal being collected.
              </p>
            </div>
            <div className="flex flex-wrap items-start gap-6">
              <div className="flex max-w-sm flex-col gap-3">
                <ScanButton onActivate={onScanRequest} />
                <p className="text-xs text-muted-foreground">
                  Runs only when you click — nothing is collected before that. ~5 seconds, signals
                  read locally; only derived hashes leave your browser.
                </p>
              </div>
              <LiveCounter
                baseline={totalFingerprints}
                updatedAt={stats?.updated_at}
                refresh={refresh}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {pillars.map(pillar => (
                <div
                  key={pillar.title}
                  className="rounded-3xl border border-white/40 bg-white/70 p-4 text-sm shadow-card dark:border-white/5 dark:bg-white/5"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {pillar.title}
                  </p>
                  <p className="mt-2 text-muted-foreground">{pillar.description}</p>
                </div>
              ))}
            </div>
            {loading ? (
              <StatCardsSkeleton />
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {statCards.map(card => (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-white/30 bg-white/80 p-4 shadow-card dark:border-white/5 dark:bg-white/5"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {card.value ? card.value.toLocaleString() : '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {error && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                Live counters are temporarily unavailable; we’ll retry automatically.
                <button
                  type="button"
                  onClick={refresh}
                  className="ml-3 inline-flex items-center rounded-lg border border-amber-200 px-3 py-1 text-xs font-semibold transition hover:bg-amber-100 dark:border-amber-500/40 dark:hover:bg-amber-500/10"
                >
                  Retry now
                </button>
              </div>
            )}
            {isCached && !error && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Served from local cache (≤120s)
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="rounded-[32px] border border-white/40 bg-white/70 p-8 shadow-card backdrop-blur-2xl dark:border-white/5 dark:bg-white/10">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Three-Lock Summary
              </p>
              <ul className="mt-6 space-y-4 text-sm">
                {lockSummary.map(item => (
                  <li key={item.lock} className="flex items-start gap-3">
                    <Lock className={`mt-0.5 h-4 w-4 ${item.color}`} />
                    <div>
                      <p className="font-semibold text-foreground">{item.lock}</p>
                      <p className="text-muted-foreground">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="/developers"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-400"
              >
                View fingerprint schema
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-[32px] border border-white/40 bg-gradient-to-br from-indigo-600/30 via-slate-900 to-slate-900 p-6 text-white shadow-[0_50px_80px_rgba(15,23,42,0.6)]">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Production Ready</p>
              <p className="mt-3 text-2xl font-semibold">Runs at &lt; 100ms latency worldwide</p>
              <p className="mt-2 text-sm text-white/80">
                Modern edge architecture with global distribution.
              </p>
              <div className="mt-4 flex items-center gap-3 text-sm">
                <Layout className="h-4 w-4" /> Static Next.js 14 export for fast global delivery.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <IdentityBellCurve percentile={percentile} rarityLabel={rarityLabel} verdict={verdict} />
      </section>
    </>
  );
}
