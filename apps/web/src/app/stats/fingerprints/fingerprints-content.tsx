'use client';

import { CalendarDays, Activity, TrendingUp, Users } from 'lucide-react';
import { TrendLineChart } from './trend-chart';
import { useFingerprintsPageData } from '@/hooks/use-stats';
import { FingerprintsPageSkeleton } from '@/components/ui/skeleton';

export function FingerprintsContent() {
  const { stats, trends: trendsPayload, loading, error } = useFingerprintsPageData();

  if (loading) {
    return <FingerprintsPageSkeleton />;
  }

  const safeStats =
    stats ?? ({ total_fingerprints: 0, unique_sessions: 0, unique_devices: 0, updated_at: Date.now() } as const);
  const trends = trendsPayload?.trends ?? [];
  const latest = trends[trends.length - 1];
  const oldest = trends[0];
  const growth = latest && oldest ? ((latest.total_visits - oldest.total_visits) / Math.max(1, oldest.total_visits)) * 100 : 0;
  const avgPerDay = trends.length ? Math.round(trends.reduce((sum, item) => sum + item.total_visits, 0) / trends.length) : 0;

  return (
    <div className="py-16">
      <div className="container mx-auto max-w-6xl px-4 space-y-12">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400">
            <CalendarDays className="h-4 w-4" /> 30-day fingerprint telemetry
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
            Daily fingerprint velocity
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Track how many fingerprints hit our API each day, how unique those sessions are, and where volatility is coming from.
          </p>
        </header>

        {/* Stats Cards */}
        <section className="grid gap-6 md:grid-cols-4">
          {[
            {
              label: 'Total fingerprints',
              value: safeStats.total_fingerprints.toLocaleString(),
              icon: Activity,
              hint: 'All-time rows in database',
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
              label: 'Unique devices',
              value: safeStats.unique_devices.toLocaleString(),
              icon: TrendingUp,
              hint: 'Distinct gold hashes',
              color: 'text-amber-500',
              bg: 'from-amber-500/10 to-orange-500/5',
            },
            {
              label: '30-day growth',
              value: `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`,
              icon: TrendingUp,
              hint: 'Compared to first day',
              color: growth > 0 ? 'text-emerald-500' : 'text-rose-500',
              bg: growth > 0 ? 'from-emerald-500/10 to-teal-500/5' : 'from-rose-500/10 to-red-500/5',
            },
          ].map((card) => (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bg} opacity-50`} />
              <div className="relative">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                  {card.label}
                </div>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{card.hint}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Chart Section */}
        <section className="rounded-3xl border border-white/20 bg-white/80 p-8 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
                Daily throughput
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {trends.length} days of activity
              </h2>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Latest day: <span className="font-semibold">{latest?.total_visits.toLocaleString() ?? '—'}</span> visits
              </p>
            </div>
            <div className="flex gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-center dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Avg / day
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {avgPerDay.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-center dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Peak day
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {trends.length ? Math.max(...trends.map(t => t.total_visits)).toLocaleString() : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Recharts Line Chart */}
          <div className="h-80 w-full">
            <TrendLineChart data={trends} />
          </div>
        </section>

        {/* Data Table */}
        <section className="rounded-3xl border border-white/20 bg-white/80 p-8 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Daily breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Date</th>
                  <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Total visits</th>
                  <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Unique devices</th>
                  <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Ratio</th>
                </tr>
              </thead>
              <tbody>
                {trends.slice().reverse().map((item) => (
                  <tr key={item.date} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-900 dark:text-white">{item.date}</td>
                    <td className="py-3 px-4 font-semibold text-indigo-600 dark:text-indigo-400">
                      {item.total_visits.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {item.unique_devices.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-500">
                      {item.total_visits > 0
                        ? `${((item.unique_devices / item.total_visits) * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
