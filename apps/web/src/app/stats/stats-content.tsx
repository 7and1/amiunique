'use client';

import Link from 'next/link';
import {
  BarChart3,
  Globe,
  TrendingUp,
  Fingerprint,
  Users,
  Activity,
  ArrowRight,
  Zap,
  Shield,
} from 'lucide-react';
import { useStatsPageData } from '@/hooks/use-stats';
import { StatsPageSkeleton } from '@/components/ui/skeleton';
import { DistributionPieChart, DistributionBarChart, TrendsAreaChart } from '@/components/charts';

export function StatsContent() {
  const { stats, browsers, os, devices, trends, loading, error, refresh } = useStatsPageData();

  if (loading) {
    return <StatsPageSkeleton />;
  }

  const safeStats = stats ?? {
    total_fingerprints: 0,
    unique_sessions: 0,
    unique_devices: 0,
    updated_at: Date.now(),
  };

  const browserList = browsers?.data?.distribution ?? [];
  const osList = os?.data?.distribution ?? [];
  const deviceList = devices?.data?.distribution ?? [];
  const trendList = trends?.trends ?? [];
  const lastUpdated = safeStats.updated_at ? new Date(safeStats.updated_at) : null;
  const isCached = Boolean((safeStats as any)?._cached);
  const sourceLabel = (safeStats as any)?._source === 'edge-cache'
    ? 'Edge cache'
    : (safeStats as any)?._source === 'local-cache'
      ? 'Local cache'
      : 'Origin';

  const hasError = Boolean(error);

  // Calculate week-over-week growth
  const latestDay = trendList[trendList.length - 1];
  const firstDay = trendList[0];
  const weekGrowth =
    latestDay && firstDay
      ? ((latestDay.total_visits - firstDay.total_visits) / Math.max(1, firstDay.total_visits)) * 100
      : 0;

  return (
    <div className="py-16">
      <div className="container mx-auto max-w-7xl px-4 space-y-16">
        {/* Hero Header */}
        <header className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400">
            <Activity className="h-4 w-4" /> Live data from the edge
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl lg:text-6xl">
            Global Fingerprint Statistics
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Real-time analytics from{' '}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {safeStats.total_fingerprints.toLocaleString()}
            </span>{' '}
            browser fingerprints analyzed worldwide.
          </p>
              {lastUpdated && (
                <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-3 justify-center">
                  Last updated: {lastUpdated.toLocaleString()}
                  {isCached && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                      Cached (≤120s)
                    </span>
                  )}
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Source: {sourceLabel}
                  </span>
                </p>
              )}
          {hasError && (
            <div className="flex items-center justify-center gap-3 text-sm text-amber-600 dark:text-amber-300">
              <span>Live data is temporarily unavailable; showing cached counters.</span>
              <button
                type="button"
                onClick={refresh}
                className="rounded-lg border border-amber-200 px-3 py-1 text-xs font-semibold transition hover:bg-amber-100 dark:border-amber-500/40 dark:hover:bg-amber-500/10"
              >
                Retry now
              </button>
            </div>
          )}
        </header>

        {/* Educational Context Section */}
        <section className="rounded-3xl border border-white/20 bg-gradient-to-br from-slate-50 to-white p-8 shadow-lg dark:border-white/10 dark:from-slate-900 dark:to-slate-800/50">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              What Do These Numbers Actually Mean?
            </h2>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Here&apos;s the deal. Every time you visit a website, your browser broadcasts a unique combination of signals&mdash;your screen size, installed fonts, graphics card, timezone, and about 80 other data points. We call this your <strong>browser fingerprint</strong>.
              </p>

              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Think of it like walking into a room. Even without showing your ID, people can identify you by your height, hair color, voice, and the way you walk. Your browser does the same thing online. Research from <a href="https://dl.acm.org/doi/fullHtml/10.1145/3178876.3186097" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">INRIA&apos;s 2.2 million device study</a> shows that <strong>35.7% of desktop users have completely unique fingerprints</strong>&mdash;meaning they can be tracked across the web without cookies.
              </p>

              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                The statistics below show real patterns from our visitors. You&apos;ll see which browsers dominate, which operating systems are most common, and how device types break down. This isn&apos;t theoretical&mdash;this is actual data from people just like you testing their fingerprints.
              </p>

              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>Why should you care?</strong> Because if you&apos;re using a rare browser/OS combination, you&apos;re easier to track. If you&apos;re in the majority, you blend in with the crowd. The numbers tell the story&mdash;scroll down to see where you might fit in.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400">
                <Shield className="h-4 w-4" />
                80+ dimensions analyzed
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Globe className="h-4 w-4" />
                Global coverage
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                <Activity className="h-4 w-4" />
                Real-time updates
              </div>
            </div>
          </div>
        </section>

        {/* Hero Stats Grid */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Total fingerprints',
              value: safeStats.total_fingerprints.toLocaleString(),
              icon: Fingerprint,
              hint: 'All-time stored',
              color: 'text-indigo-500',
              bg: 'from-indigo-500/10 to-purple-500/5',
            },
            {
              label: 'Unique sessions',
              value: safeStats.unique_sessions.toLocaleString(),
              icon: Users,
              hint: 'Distinct bronze hashes',
              color: 'text-sky-500',
              bg: 'from-sky-500/10 to-cyan-500/5',
            },
            {
              label: 'Hardware profiles',
              value: safeStats.unique_devices.toLocaleString(),
              icon: Shield,
              hint: 'Distinct gold hashes',
              color: 'text-amber-500',
              bg: 'from-amber-500/10 to-orange-500/5',
            },
            {
              label: '7-day growth',
              value: `${weekGrowth > 0 ? '+' : ''}${weekGrowth.toFixed(1)}%`,
              icon: TrendingUp,
              hint: 'Week over week',
              color: weekGrowth >= 0 ? 'text-emerald-500' : 'text-rose-500',
              bg: weekGrowth >= 0 ? 'from-emerald-500/10 to-teal-500/5' : 'from-rose-500/10 to-red-500/5',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-50`} />
              <div className="relative">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  {stat.label}
                </div>
                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{stat.hint}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Quick Distribution Preview with Charts */}
        <section className="grid gap-8 lg:grid-cols-3">
          {/* Top Browsers - Horizontal Bar Chart */}
          <div className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
              <Globe className="h-4 w-4 text-indigo-500" />
              Top Browsers
            </div>
            {browserList.length > 0 ? (
              <DistributionBarChart
                data={browserList.slice(0, 6)}
                height={220}
                layout="vertical"
                gradientFrom="#6366f1"
                gradientTo="#a855f7"
              />
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-slate-500">
                No data available
              </div>
            )}
          </div>

          {/* Top OS - Horizontal Bar Chart */}
          <div className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
              <BarChart3 className="h-4 w-4 text-teal-500" />
              Operating Systems
            </div>
            {osList.length > 0 ? (
              <DistributionBarChart
                data={osList.slice(0, 6)}
                height={220}
                layout="vertical"
                gradientFrom="#14b8a6"
                gradientTo="#22c55e"
              />
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-slate-500">
                No data available
              </div>
            )}
          </div>

          {/* Device Mix - Pie Chart */}
          <div className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
              <Zap className="h-4 w-4 text-amber-500" />
              Device Types
            </div>
            {deviceList.length > 0 ? (
              <DistributionPieChart
                data={deviceList}
                height={220}
                colors={['#6366f1', '#0ea5e9', '#f59e0b']}
                showLegend={true}
              />
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-slate-500">
                No data available
              </div>
            )}
          </div>
        </section>

        {/* Trends Area Chart - Full Width */}
        {trendList.length > 0 && (
          <section className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                Daily Fingerprint Trends
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Last {trendList.length} days
              </span>
            </div>
            <TrendsAreaChart data={trendList} height={320} showGrid={true} />
          </section>
        )}

        {/* Deep Dive Cards */}
        <section className="grid gap-6 md:grid-cols-2">
          {[
            {
              title: 'Daily Fingerprint Trends',
              description:
                'Explore the full 30-day history of visits, unique devices, and growth patterns visualized with interactive charts.',
              href: '/stats/fingerprints',
              icon: TrendingUp,
              color: 'from-indigo-500 to-purple-500',
              stats: `${trendList.length} days tracked`,
            },
            {
              title: 'Global Distribution',
              description:
                'Dive deeper into browser, OS, country, and screen resolution diversity with detailed pie charts and bar graphs.',
              href: '/stats/global-distribution',
              icon: Globe,
              color: 'from-sky-500 to-cyan-500',
              stats: `${browserList.length + osList.length} dimensions`,
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-8 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-slate-900/80"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`} />

              <div className="relative">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color}`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>

                <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Deep dive
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{card.title}</h3>
                <p className="mt-3 text-slate-600 dark:text-slate-400">{card.description}</p>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.stats}</span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
                    Explore <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {/* CTA Section */}
        <section className="text-center space-y-6 py-8">
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Want to see where you fit in these statistics?
          </p>
          <Link
            href="/scan"
            className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/25"
          >
            <Fingerprint className="h-6 w-6" />
            Scan Your Fingerprint
          </Link>
        </section>
      </div>
    </div>
  );
}
