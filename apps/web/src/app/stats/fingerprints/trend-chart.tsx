'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DailyTrendItem } from '@/lib/api';

interface TrendLineChartProps {
  data: DailyTrendItem[];
}

/**
 * Custom tooltip component for the chart
 */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-xl border border-white/20 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95">
      <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600 dark:text-slate-400">
              {entry.dataKey === 'total_visits' ? 'Total visits' : 'Unique devices'}:
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Trend line chart using Recharts
 * Shows daily visits and unique devices over time
 */
export function TrendLineChart({ data }: TrendLineChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
        No data available yet. Start collecting fingerprints!
      </div>
    );
  }

  // Format date for display
  const chartData = data.map((item) => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="colorDevices" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(148, 163, 184, 0.2)"
          vertical={false}
        />
        <XAxis
          dataKey="displayDate"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickFormatter={(value) =>
            value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
          }
          dx={-10}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{
            paddingTop: '20px',
          }}
          formatter={(value) =>
            value === 'total_visits' ? 'Total visits' : 'Unique devices'
          }
        />
        <Area
          type="monotone"
          dataKey="total_visits"
          stroke="#6366f1"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorVisits)"
          animationDuration={1000}
        />
        <Area
          type="monotone"
          dataKey="unique_devices"
          stroke="#0ea5e9"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorDevices)"
          animationDuration={1200}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
