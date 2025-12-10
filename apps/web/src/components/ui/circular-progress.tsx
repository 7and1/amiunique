'use client';

import { cn } from '@/lib/utils';

interface CircularProgressProps {
  /** Progress value (0-100) */
  value: number;
  /** Size of the circular progress */
  size?: 'sm' | 'md' | 'lg';
  /** Current dimension being collected */
  dimension?: string;
  /** Estimated time remaining */
  eta?: string;
  /** Show the progress text inside */
  showValue?: boolean;
  /** Custom color class */
  colorClass?: string;
  /** Stroke width */
  strokeWidth?: number;
  className?: string;
}

const sizeMap = {
  sm: { size: 64, fontSize: 'text-xs', strokeWidth: 4 },
  md: { size: 120, fontSize: 'text-lg', strokeWidth: 6 },
  lg: { size: 180, fontSize: 'text-2xl', strokeWidth: 8 },
};

/**
 * Circular progress indicator with animated stroke
 */
export function CircularProgress({
  value,
  size = 'md',
  dimension,
  eta,
  showValue = true,
  colorClass = 'stroke-primary-500',
  strokeWidth: customStrokeWidth,
  className,
}: CircularProgressProps) {
  const { size: svgSize, fontSize, strokeWidth: defaultStrokeWidth } = sizeMap[size];
  const strokeWidth = customStrokeWidth ?? defaultStrokeWidth;
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          className="transform -rotate-90"
          width={svgSize}
          height={svgSize}
        >
          {/* Background circle */}
          <circle
            className="stroke-slate-200 dark:stroke-slate-700"
            fill="none"
            strokeWidth={strokeWidth}
            r={radius}
            cx={svgSize / 2}
            cy={svgSize / 2}
          />
          {/* Progress circle */}
          <circle
            className={cn(colorClass, 'transition-all duration-300 ease-out')}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            r={radius}
            cx={svgSize / 2}
            cy={svgSize / 2}
          />
        </svg>

        {/* Center content */}
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('font-bold text-slate-900 dark:text-white', fontSize)}>
              {Math.round(value)}%
            </span>
            {eta && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ~{eta}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dimension label */}
      {dimension && (
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 animate-pulse">
            {dimension}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Animated scanning indicator with pulsing rings
 */
export function ScanningIndicator({
  dimension,
  className,
}: {
  dimension?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative">
        {/* Pulsing rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-24 animate-ping rounded-full bg-primary-500/20" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-20 w-20 animate-ping rounded-full bg-primary-500/30 animation-delay-150" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 animate-ping rounded-full bg-primary-500/40 animation-delay-300" />
        </div>

        {/* Center icon */}
        <div className="relative flex h-28 w-28 items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-white">
            <svg
              className="h-6 w-6 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      </div>

      {dimension && (
        <p className="text-sm text-slate-600 dark:text-slate-400 animate-pulse">
          {dimension}
        </p>
      )}
    </div>
  );
}
