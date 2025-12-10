'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DistributionItem } from '@/lib/api';

interface ChartDataItem extends DistributionItem {
  label: string;
}

interface DistributionBarChartProps {
  data: DistributionItem[];
  height?: number;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  showGrid?: boolean;
  layout?: 'vertical' | 'horizontal';
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataItem }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <p className="font-medium text-slate-900 dark:text-white">{data.label}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {data.percentage}% ({data.count.toLocaleString()} visits)
        </p>
      </div>
    );
  }
  return null;
};

export function DistributionBarChart({
  data,
  height = 300,
  gradientFrom = '#6366f1',
  gradientTo = '#a855f7',
  showGrid = false,
  layout = 'horizontal',
}: DistributionBarChartProps) {
  // Transform data to have consistent 'label' field
  const chartData: ChartDataItem[] = data.map((item) => ({
    ...item,
    label: item.name || item.code || item.resolution || item.vendor || 'Unknown',
  }));

  const gradientId = `barGradient-${Math.random().toString(36).slice(2, 9)}`;

  if (layout === 'vertical') {
    return (
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-700"
                horizontal={true}
                vertical={false}
              />
            )}
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
              className="text-slate-500 dark:text-slate-400"
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={75}
              className="text-slate-500 dark:text-slate-400"
            />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={gradientFrom} />
                <stop offset="100%" stopColor={gradientTo} />
              </linearGradient>
            </defs>
            <Bar
              dataKey="percentage"
              fill={`url(#${gradientId})`}
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 10, bottom: 25 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-700"
              vertical={false}
            />
          )}
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            angle={-35}
            textAnchor="end"
            interval={0}
            className="text-slate-500 dark:text-slate-400"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
            className="text-slate-500 dark:text-slate-400"
          />
          <Tooltip content={<CustomTooltip />} />
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientFrom} />
              <stop offset="100%" stopColor={gradientTo} />
            </linearGradient>
          </defs>
          <Bar
            dataKey="percentage"
            fill={`url(#${gradientId})`}
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
