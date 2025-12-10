'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { DistributionItem } from '@/lib/api';

interface DistributionPieChartProps {
  data: DistributionItem[];
  title?: string;
  colors?: string[];
  showLegend?: boolean;
  height?: number;
}

const DEFAULT_COLORS = [
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#a855f7', // purple-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#14b8a6', // teal-500
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: DistributionItem & { fill: string; label: string } }> }) => {
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

export function DistributionPieChart({
  data,
  title,
  colors = DEFAULT_COLORS,
  showLegend = true,
  height = 300,
}: DistributionPieChartProps) {
  // Transform data to have consistent 'label' field and required fill
  const chartData = data.map((item, index) => ({
    ...item,
    label: item.name || item.code || item.resolution || item.vendor || 'Unknown',
    fill: colors[index % colors.length],
  }));

  return (
    <div className="w-full" style={{ height }}>
      {title && (
        <h3 className="mb-4 text-sm font-medium text-slate-600 dark:text-slate-400">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="percentage"
            nameKey="label"
            strokeWidth={0}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value: string) => (
                <span className="text-sm text-slate-700 dark:text-slate-300">{value}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
