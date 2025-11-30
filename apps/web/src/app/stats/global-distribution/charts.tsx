'use client';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Premium color palette matching Neo-SaaS design
const COLORS = {
  browsers: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308'],
  os: ['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f97316'],
  countries: ['#f59e0b', '#f97316', '#ef4444', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1'],
  screens: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308'],
  devices: ['#6366f1', '#0ea5e9', '#10b981'],
};

interface ChartItem {
  name: string;
  value: number;
  percentage: number;
  [key: string]: string | number;
}

interface DistributionPieChartProps {
  data: ChartItem[];
  colorScheme: keyof typeof COLORS;
}

/**
 * Custom tooltip for pie charts
 */
function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: ChartItem }>;
}) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-xl border border-white/20 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95">
      <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {item.value.toLocaleString()} fingerprints
      </p>
      <p className="font-mono text-sm text-indigo-600 dark:text-indigo-400">
        {item.percentage.toFixed(1)}%
      </p>
    </div>
  );
}

/**
 * Premium pie chart with glassmorphism styling
 */
export function DistributionPieChart({ data, colorScheme }: DistributionPieChartProps) {
  const colors = COLORS[colorScheme];

  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          animationDuration={800}
          animationEasing="ease-out"
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<PieTooltip />} />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="circle"
          iconSize={10}
          formatter={(value) => (
            <span className="text-sm text-slate-700 dark:text-slate-300">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface BarChartProps {
  data: ChartItem[];
  colorScheme: keyof typeof COLORS;
  layout?: 'horizontal' | 'vertical';
}

/**
 * Custom tooltip for bar charts
 */
function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartItem }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-xl border border-white/20 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95">
      <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {item.value.toLocaleString()} fingerprints
      </p>
      <p className="font-mono text-sm text-indigo-600 dark:text-indigo-400">
        {item.percentage.toFixed(1)}%
      </p>
    </div>
  );
}

/**
 * Premium horizontal bar chart
 */
export function DistributionBarChart({ data, colorScheme, layout = 'horizontal' }: BarChartProps) {
  const colors = COLORS[colorScheme];

  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
        No data available
      </div>
    );
  }

  const isVertical = layout === 'vertical';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout={isVertical ? 'vertical' : 'horizontal'}
        margin={{ top: 10, right: 30, left: isVertical ? 80 : 0, bottom: isVertical ? 0 : 40 }}
      >
        <defs>
          {data.map((_, index) => (
            <linearGradient
              key={`gradient-${index}`}
              id={`barGradient-${colorScheme}-${index}`}
              x1="0"
              y1="0"
              x2={isVertical ? '1' : '0'}
              y2={isVertical ? '0' : '1'}
            >
              <stop offset="0%" stopColor={colors[index % colors.length]} stopOpacity={0.9} />
              <stop offset="100%" stopColor={colors[index % colors.length]} stopOpacity={0.5} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(148, 163, 184, 0.2)"
          horizontal={!isVertical}
          vertical={isVertical}
        />
        {isVertical ? (
          <>
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
              }
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              width={70}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
              }
            />
          </>
        )}
        <Tooltip content={<BarTooltip />} />
        <Bar
          dataKey="value"
          radius={isVertical ? [0, 6, 6, 0] : [6, 6, 0, 0]}
          animationDuration={1000}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={`url(#barGradient-${colorScheme}-${index})`}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface DeviceDonutProps {
  data: ChartItem[];
}

/**
 * Device mix donut chart with center label
 */
export function DeviceDonutChart({ data }: DeviceDonutProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = COLORS.devices;

  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
        No device data
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            animationDuration={800}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">devices</p>
        </div>
      </div>
    </div>
  );
}
