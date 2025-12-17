'use client';

import { Globe, Monitor, Smartphone, BarChart2, Cpu, MapPin, Layers, Database } from 'lucide-react';
import { DistributionPieChart, DistributionBarChart, DeviceDonutChart } from './charts';
import { useGlobalDistributionData } from '@/hooks/use-stats';
import { GlobalDistributionSkeleton } from '@/components/ui/skeleton';

export function DistributionContent() {
  const { stats, browsers, os, devices, countries, screens, loading, error } = useGlobalDistributionData();

  if (loading) {
    return <GlobalDistributionSkeleton />;
  }

  const safeStats =
    stats ?? ({ total_fingerprints: 0, unique_sessions: 0, unique_devices: 0, updated_at: Date.now() } as const);

  // Transform API data to chart format
  const toChartData = (list: any[], labelKey: string) =>
    (list || []).map(item => ({
      name: item[labelKey] || 'Unknown',
      value: item.count || 0,
      percentage: parseFloat(item.percentage) || 0,
    }));

  const browserData = toChartData(browsers?.data?.distribution ?? [], 'name');
  const osData = toChartData(os?.data?.distribution ?? [], 'name');
  const countryData = toChartData(countries?.data?.distribution ?? [], 'code');
  const screenData = toChartData(screens?.data?.distribution ?? [], 'resolution');
  const deviceData = toChartData(devices?.data?.distribution ?? [], 'name');

  return (
    <div className="py-16">
      <div className="container mx-auto max-w-7xl px-4 space-y-12">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400">
            <Globe className="h-4 w-4" /> Live distribution snapshot
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
            Where fingerprints come from
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Browsers, operating systems, device classes, and top countries represented inside{' '}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {safeStats.total_fingerprints.toLocaleString()}
            </span>{' '}
            stored visits.
          </p>
        </header>

        {/* Quick Stats Row */}
        <section className="grid gap-4 md:grid-cols-4">
          {[
            {
              label: 'Total fingerprints',
              value: safeStats.total_fingerprints.toLocaleString(),
              icon: Database,
              color: 'text-indigo-500',
              bg: 'from-indigo-500/10 to-purple-500/5',
            },
            {
              label: 'Unique sessions',
              value: safeStats.unique_sessions.toLocaleString(),
              icon: Layers,
              color: 'text-sky-500',
              bg: 'from-sky-500/10 to-cyan-500/5',
            },
            {
              label: 'Hardware profiles',
              value: safeStats.unique_devices.toLocaleString(),
              icon: Cpu,
              color: 'text-amber-500',
              bg: 'from-amber-500/10 to-orange-500/5',
            },
            {
              label: 'Countries',
              value: countryData.length.toString(),
              icon: MapPin,
              color: 'text-emerald-500',
              bg: 'from-emerald-500/10 to-teal-500/5',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-50`} />
              <div className="relative">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  {stat.label}
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Browser & OS Charts */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Browsers Pie Chart */}
          <div className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                <Monitor className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Browser Distribution</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Top 8 browsers by fingerprint count</p>
              </div>
            </div>
            <div className="h-72">
              <DistributionPieChart data={browserData} colorScheme="browsers" />
            </div>
          </div>

          {/* OS Pie Chart */}
          <div className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
                <Cpu className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Operating Systems</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Top 8 OS platforms</p>
              </div>
            </div>
            <div className="h-72">
              <DistributionPieChart data={osData} colorScheme="os" />
            </div>
          </div>
        </section>

        {/* Countries Bar Chart */}
        <section className="rounded-3xl border border-white/20 bg-white/80 p-8 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                <MapPin className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Geographic Distribution</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Top 10 countries by fingerprint submissions
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Data from</p>
              <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">Real-time</p>
            </div>
          </div>
          <div className="h-80">
            <DistributionBarChart data={countryData} colorScheme="countries" layout="horizontal" />
          </div>
        </section>

        {/* Screen Resolutions & Device Mix */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Screen Resolutions */}
          <div className="lg:col-span-2 rounded-3xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                <BarChart2 className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Screen Resolutions</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Most common viewport sizes
                </p>
              </div>
            </div>
            <div className="h-72">
              <DistributionBarChart data={screenData} colorScheme="screens" layout="vertical" />
            </div>
          </div>

          {/* Device Mix Donut */}
          <div className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Smartphone className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Device Mix</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Desktop vs Mobile</p>
              </div>
            </div>
            <div className="h-64">
              <DeviceDonutChart data={deviceData} />
            </div>
            {/* Device legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {deviceData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor:
                        index === 0 ? '#6366f1' : index === 1 ? '#0ea5e9' : '#10b981',
                    }}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                    {item.name}: {item.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Source Footer */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Data Source</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  SQLite database with real-time analytics
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">Last updated</p>
              <p className="font-mono text-sm text-slate-900 dark:text-white">
                {new Date(safeStats.updated_at).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
