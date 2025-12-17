'use client';

import Link from 'next/link';
import { ArrowRight, Layout, Lock, Sparkles, AlertTriangle, Shield, Eye, Fingerprint, MonitorSmartphone, Smartphone, Laptop, CheckCircle2 } from 'lucide-react';
import { ScanButton } from '@/components/home/scan-button';
import { IdentityBellCurve } from '@/components/home/identity-bell-curve';
import { FingerprintCardGrid } from '@/components/home/fingerprint-card-grid';
import { ContributionPanel } from '@/components/home/contribution-panel';
import { ValueProps } from '@/components/home/value-props';
import { LiveCounter } from '@/components/home/live-counter';
import { useGlobalStats } from '@/hooks/use-stats';
import { Skeleton } from '@/components/ui/skeleton';

const pillars = [
  {
    title: 'Transparency',
    description: 'Glassmorphism + gradient borders signal that every collector is documented and user controllable.',
  },
  {
    title: 'Distribution',
    description: 'Bell curve-first storytelling shows whether your fingerprint hides in the crowd or glows on the edge.',
  },
  {
    title: 'Cleanliness',
    description: 'Spacious typography, Geist Sans + Mono, and a monochrome palette keep focus on the data.',
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

export function HomeContent() {
  const { data: stats, loading, error, refresh } = useGlobalStats();
  const isCached = Boolean((stats as any)?._cached);

  const totalFingerprints = stats?.total_fingerprints ?? 0;
  const uniqueSessions = stats?.unique_sessions ?? 0;
  const uniqueDevices = stats?.unique_devices ?? 0;
  const rarityBase = stats && uniqueSessions > 0 ? Math.max(1, Math.round(totalFingerprints / uniqueSessions)) : 0;
  const percentile = stats && totalFingerprints > 0
    ? Math.min(99.99, Math.max(5, 100 - (uniqueSessions / totalFingerprints) * 100))
    : 50;
  const rarityLabel = stats && rarityBase ? `1 in ${rarityBase.toLocaleString()}` : '—';
  const verdict = percentile > 95
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
    <div className="flex flex-col">
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
                AmiUnique.io quantifies how identifiable your browser is in a database of 2M+ fingerprints. The Neo-SaaS
                interface blends transparency, statistical storytelling, and privacy-first messaging so users understand
                every signal being collected.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <ScanButton />
              <LiveCounter baseline={totalFingerprints} updatedAt={stats?.updated_at} refresh={refresh} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {pillars.map(pillar => (
                <div
                  key={pillar.title}
                  className="rounded-3xl border border-white/40 bg-white/70 p-4 text-sm shadow-card dark:border-white/5 dark:bg-white/5"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{pillar.title}</p>
                  <p className="mt-2 text-muted-foreground">{pillar.description}</p>
                </div>
              ))}
            </div>
            {loading ? (
              <StatCardsSkeleton />
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {statCards.map(card => (
                  <div key={card.label} className="rounded-2xl border border-white/30 bg-white/80 p-4 shadow-card dark:border-white/5 dark:bg-white/5">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{card.label}</p>
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
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Three-Lock Summary</p>
              <ul className="mt-6 space-y-4 text-sm">
                {[
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
                ].map(item => (
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
              <p className="mt-2 text-sm text-white/80">Modern edge architecture with global distribution.</p>
              <div className="mt-4 flex items-center gap-3 text-sm">
                <Layout className="h-4 w-4" /> Static Next.js 14 export for fast global delivery.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto space-y-10 px-4 py-16">
        <IdentityBellCurve percentile={percentile} rarityLabel={rarityLabel} verdict={verdict} />
        <ContributionPanel />
      </section>

      <section className="container mx-auto space-y-10 px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Fingerprint focus</p>
            <h2 className="mt-2 text-3xl font-semibold">Top signals shaping your uniqueness</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Each card surfaces a high-value dimension with its rarity badge so security teams see where to focus mitigation
              (e.g., reduce installed fonts, normalize screen settings, or rotate network egress).
            </p>
          </div>
          <Link href="/scan/result" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
            Explore full breakdown
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <FingerprintCardGrid />
      </section>

      <section className="container mx-auto space-y-10 px-4 py-16">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Platform features</p>
          <h2 className="mt-2 text-3xl font-semibold">Built for transparency and accuracy</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Every fingerprint dimension is documented, auditable, and designed to help you understand your digital identity.
          </p>
        </div>
        <ValueProps />
      </section>

      {/* Educational Content Section - 1000+ words */}
      <section className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <article className="prose prose-slate dark:prose-invert max-w-none">
            {/* Main H2 - Target keyword "Am I Unique" */}
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl mb-8 flex items-center gap-3">
              <Fingerprint className="h-10 w-10 text-indigo-500" />
              Am I Unique? Understanding Your Browser Identity
            </h2>

            {/* Section 1: Simple explanation */}
            <div className="rounded-3xl border border-white/30 bg-white/80 p-8 shadow-lg dark:border-white/5 dark:bg-slate-800/50 mb-8">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-500" />
                The Simple Truth About Digital Fingerprints
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Here&apos;s something that might surprise you: Every time you visit a website, your browser leaves behind a unique &quot;fingerprint&quot; - and no, we&apos;re not talking about cookies.
              </p>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Think of it like this: Imagine walking into a room and someone could identify you just by the way you walk, the shoes you wear, the watch on your wrist, and the phone in your pocket. They don&apos;t need your name. They don&apos;t need your ID. They just... <span className="font-semibold text-indigo-600 dark:text-indigo-400">know it&apos;s you</span>.
              </p>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                That&apos;s browser fingerprinting. Websites can identify you by combining dozens of technical details about your browser and device - your screen resolution, installed fonts, graphics card, timezone, language settings, and about <span className="font-semibold">80+ other signals</span>.
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                The crazy part? <span className="font-semibold text-rose-600 dark:text-rose-400">You can&apos;t delete it like a cookie</span>. It&apos;s not stored on your computer. It&apos;s calculated fresh every time you visit a site. And it works even in &quot;private&quot; or &quot;incognito&quot; mode.
              </p>
            </div>

            {/* Section 2: Statistics with Data Table */}
            <div className="rounded-3xl border border-white/30 bg-white/80 p-8 shadow-lg dark:border-white/5 dark:bg-slate-800/50 mb-8">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <MonitorSmartphone className="h-5 w-5 text-cyan-500" />
                Here&apos;s the Mind-Blowing Part (The Numbers Don&apos;t Lie)
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                We&apos;ve analyzed millions of browser fingerprints. The research is clear - and honestly, a bit scary:
              </p>

              {/* Data Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4 text-left font-semibold text-slate-900 dark:text-white">Device Type</th>
                      <th className="py-3 px-4 text-left font-semibold text-slate-900 dark:text-white">Uniqueness Rate</th>
                      <th className="py-3 px-4 text-left font-semibold text-slate-900 dark:text-white">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <Laptop className="h-4 w-4 text-indigo-500" /> Desktop PC
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">35.7%</td>
                      <td className="py-3 px-4 text-slate-500">
                        <a href="https://dl.acm.org/doi/fullHtml/10.1145/3178876.3186097" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">INRIA Study</a>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-cyan-500" /> Mobile Devices
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-cyan-600 dark:text-cyan-400">18.5%</td>
                      <td className="py-3 px-4 text-slate-500">
                        <a href="https://dl.acm.org/doi/fullHtml/10.1145/3178876.3186097" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">INRIA Study</a>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-slate-500" /> iPhone
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600 dark:text-slate-400">33%</td>
                      <td className="py-3 px-4 text-slate-500">
                        <a href="https://medium.com/slido-dev-blog/we-collected-500-000-browser-fingerprints-here-is-what-we-found-82c319464dc9" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Slido Research</a>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 flex items-center gap-2">
                        <MonitorSmartphone className="h-4 w-4 text-amber-500" /> All Users (Average)
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-amber-600 dark:text-amber-400">~60%</td>
                      <td className="py-3 px-4 text-slate-500">
                        <a href="https://amiunique.org/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">FingerprintJS</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-rose-50 dark:bg-rose-500/10 p-4 border border-rose-200 dark:border-rose-500/20">
                  <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">Did you know?</p>
                  <p className="text-sm text-rose-600 dark:text-rose-300">
                    Within just 24 hours, nearly <span className="font-bold">10% of devices</span> change their fingerprint. But the remaining 90%? They&apos;re trackable for weeks or months.
                  </p>
                </div>
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 p-4 border border-amber-200 dark:border-amber-500/20">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">2024 Update</p>
                  <p className="text-sm text-amber-600 dark:text-amber-300">
                    Google announced they will <span className="font-bold">no longer prohibit</span> their advertising customers from fingerprinting users. The UK ICO sharply criticized this move.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Why it matters */}
            <div className="rounded-3xl border border-white/30 bg-white/80 p-8 shadow-lg dark:border-white/5 dark:bg-slate-800/50 mb-8">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Why Should You Care? (Real Talk)
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Here&apos;s the thing - <span className="font-semibold">over 70% of internet users</span> say they&apos;re concerned about online tracking. But only <span className="font-semibold">43% actually understand</span> how it works. That gap is a problem.
              </p>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Browser fingerprinting enables:
              </p>
              <ul className="space-y-3 mb-4">
                <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                  <span className="mt-1 h-2 w-2 rounded-full bg-rose-500 flex-shrink-0" />
                  <span><span className="font-semibold">Cross-site tracking</span> - Advertisers can follow you across the entire internet, even without cookies</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <span><span className="font-semibold">Price discrimination</span> - Some sites show different prices based on your device and location profile</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                  <span className="mt-1 h-2 w-2 rounded-full bg-purple-500 flex-shrink-0" />
                  <span><span className="font-semibold">Account linking</span> - Your &quot;anonymous&quot; browsing can be connected to your real identity</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                  <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
                  <span><span className="font-semibold">Bypassing consent</span> - Unlike cookies, fingerprinting doesn&apos;t require your permission under most regulations</span>
                </li>
              </ul>
              <p className="text-slate-600 dark:text-slate-300">
                The good news? <span className="font-semibold text-emerald-600 dark:text-emerald-400">Understanding is the first step to protection</span>. That&apos;s exactly why we built this tool.
              </p>
            </div>

            {/* Section 4: Three-Lock System */}
            <div className="rounded-3xl border border-white/30 bg-white/80 p-8 shadow-lg dark:border-white/5 dark:bg-slate-800/50 mb-8">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-500" />
                The Three-Lock System: How We Identify You
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                We&apos;ve developed a &quot;Three-Lock&quot; classification system to help you understand fingerprinting stability:
              </p>

              <div className="space-y-4">
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 p-5 border border-amber-200 dark:border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-5 w-5 text-amber-500" />
                    <span className="font-semibold text-amber-700 dark:text-amber-400">Gold Lock (Hardware)</span>
                    <span className="text-xs bg-amber-200 dark:bg-amber-500/30 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">Most Stable</span>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Canvas rendering, WebGL signatures, audio processing patterns, GPU characteristics. These survive browser reinstalls and even persist across different browsers on the same device.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-100 dark:bg-slate-700/50 p-5 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-5 w-5 text-slate-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Silver Lock (Software)</span>
                    <span className="text-xs bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">Medium Stability</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Installed fonts, browser plugins, language settings, timezone, screen resolution. These change when you update your browser or OS.
                  </p>
                </div>

                <div className="rounded-2xl bg-orange-50 dark:bg-orange-500/10 p-5 border border-orange-200 dark:border-orange-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-5 w-5 text-orange-500" />
                    <span className="font-semibold text-orange-700 dark:text-orange-400">Bronze Lock (Network)</span>
                    <span className="text-xs bg-orange-200 dark:bg-orange-500/30 text-orange-800 dark:text-orange-300 px-2 py-0.5 rounded-full">Session-Specific</span>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    IP address, ASN (your internet provider), TLS cipher suites, connection timing. These change when you switch networks or use a VPN.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 5: What you can do */}
            <div className="rounded-3xl border border-white/30 bg-white/80 p-8 shadow-lg dark:border-white/5 dark:bg-slate-800/50 mb-8">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                What Can You Actually Do About It?
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Look, I&apos;m not going to sugarcoat it - completely avoiding fingerprinting is nearly impossible. But here are practical steps that actually work:
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { title: 'Use Firefox with Enhanced Tracking Protection', desc: 'Firefox actively resists fingerprinting attempts. Enable "Strict" mode in privacy settings.' },
                  { title: 'Try the Tor Browser for sensitive browsing', desc: 'Tor standardizes many fingerprint signals, making you blend in with other Tor users.' },
                  { title: 'Keep your browser updated', desc: 'Updates often include fingerprinting countermeasures. Chrome and Safari are improving too.' },
                  { title: 'Be mindful of browser extensions', desc: 'Each extension you install can make your fingerprint more unique. Use sparingly.' },
                  { title: 'Consider using multiple browsers', desc: 'Use different browsers for different activities to compartmentalize your digital identity.' },
                  { title: 'Understand your baseline first', desc: 'Run our scan to see exactly what makes you unique - knowledge is power.' },
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 p-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{tip.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 6: Bottom Line + CTA */}
            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-8 text-white shadow-2xl">
              <h3 className="text-xl font-semibold mb-4">
                The Bottom Line
              </h3>
              <p className="text-white/90 mb-4">
                Browser fingerprinting isn&apos;t going away. In fact, as cookies become less reliable for tracking, fingerprinting is becoming <span className="font-semibold">more common, not less</span>.
              </p>
              <p className="text-white/90 mb-6">
                The question isn&apos;t whether you have a unique fingerprint - statistically, you probably do. The question is: <span className="font-semibold">do you know what it looks like?</span>
              </p>
              <p className="text-white/90 mb-6">
                We built AmiUnique.io to give you that visibility. No tracking, no data selling - just honest, transparent information about your digital identity. Because you deserve to know.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/scan"
                  className="inline-flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-indigo-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  <Fingerprint className="h-6 w-6" />
                  Scan My Fingerprint Now
                </Link>
                <span className="text-sm text-white/70">Free • No account required • Results in seconds</span>
              </div>
            </div>

            {/* Sources footer */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-500 mb-2 font-semibold uppercase tracking-wider">Sources & Further Reading</p>
              <ul className="text-xs text-slate-400 dark:text-slate-500 space-y-1">
                <li>
                  <a href="https://dl.acm.org/doi/fullHtml/10.1145/3178876.3186097" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 transition-colors">
                    INRIA/Inria: &quot;Hiding in the Crowd: An Analysis of the Effectiveness of Browser Fingerprinting at Large Scale&quot;
                  </a>
                </li>
                <li>
                  <a href="https://medium.com/slido-dev-blog/we-collected-500-000-browser-fingerprints-here-is-what-we-found-82c319464dc9" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 transition-colors">
                    Slido Engineering: &quot;We&apos;ve Analysed 500,000 Browser Fingerprints&quot;
                  </a>
                </li>
                <li>
                  <a href="https://amiunique.org/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 transition-colors">
                    AmIUnique.org - Original browser fingerprinting research project
                  </a>
                </li>
              </ul>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
