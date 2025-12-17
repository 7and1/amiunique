'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Generate smooth Gaussian bell curve path
 */
const generateCurvePath = () => {
  const width = 100;
  const height = 100;
  const spread = 18;
  const points: Array<[number, number]> = [];

  for (let i = 0; i <= 60; i += 1) {
    const x = (i / 60) * width;
    const exponent = -0.5 * Math.pow((x - width / 2) / spread, 2);
    const gaussian = Math.exp(exponent);
    const y = height - gaussian * 70 - 8;
    points.push([x, y]);
  }

  const top = points.map(point => `${point[0]},${point[1]}`).join(' ');
  return `M0 ${height} L ${top} L ${width} ${height} Z`;
};

const curvePath = generateCurvePath();

interface IdentityBellCurveProps {
  percentile: number;
  rarityLabel: string;
  verdict: string;
}

/**
 * Identity Bell Curve Component
 * Shows user's fingerprint uniqueness on a Gaussian distribution
 * Features: pulsating dot, frosted glass tooltip, smooth animations
 */
export function IdentityBellCurve({ percentile, rarityLabel, verdict }: IdentityBellCurveProps) {
  const shouldReduceMotion = useReducedMotion();
  const clamped = Math.min(95, Math.max(5, percentile));

  // Calculate Y position on the curve based on percentile
  const getYPositionOnCurve = (percent: number) => {
    const x = percent;
    const exponent = -0.5 * Math.pow((x - 50) / 18, 2);
    const gaussian = Math.exp(exponent);
    // Convert to percentage from top (inverted because SVG y=0 is top)
    return 100 - gaussian * 70 - 8;
  };

  const dotYPercent = getYPositionOnCurve(clamped);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-[40px] border border-white/30 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-purple-500/5 p-[2px] dark:border-white/10"
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20 opacity-50" />

      <div className="relative rounded-[38px] bg-white/80 p-8 backdrop-blur-xl dark:bg-slate-900/80">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-indigo-500 dark:text-indigo-400">
              Identity Distribution
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-3xl">
              Where you sit on the bell curve
            </h3>
            <p className="mt-2 max-w-lg text-sm text-slate-600 dark:text-slate-400">
              Percentile computed across our database of 2M+ fingerprints in real-time.
            </p>
          </div>

          {/* Percentile card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 px-6 py-4 text-right shadow-lg shadow-indigo-500/10 dark:border-indigo-500/20 dark:from-slate-800 dark:to-indigo-900/20"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Percentile
            </p>
            <p className="mt-1 font-mono text-4xl font-bold text-indigo-600 dark:text-indigo-400">
              {percentile.toFixed(2)}%
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{rarityLabel}</p>
          </motion.div>
        </div>

        {/* Bell Curve SVG */}
        <div className="relative mt-8">
          <svg viewBox="0 0 100 100" className="h-56 w-full md:h-64" preserveAspectRatio="none">
            <defs>
              {/* Gradient fill for the curve */}
              <linearGradient id="bellCurveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(99,102,241,0.45)" />
                <stop offset="50%" stopColor="rgba(99,102,241,0.25)" />
                <stop offset="100%" stopColor="rgba(99,102,241,0.05)" />
              </linearGradient>

              {/* Glow filter for the dot */}
              <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Gradient for the curve stroke */}
              <linearGradient id="curveStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(99,102,241,0.3)" />
                <stop offset="50%" stopColor="rgba(99,102,241,0.8)" />
                <stop offset="100%" stopColor="rgba(99,102,241,0.3)" />
              </linearGradient>
            </defs>

            {/* Curve area fill */}
            <motion.path
              d={curvePath}
              fill="url(#bellCurveFill)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            />

            {/* Curve stroke */}
            <motion.path
              d={curvePath}
              fill="none"
              stroke="url(#curveStroke)"
              strokeWidth="0.6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />

            {/* Vertical line from dot to base */}
            <motion.line
              x1={clamped}
              y1={dotYPercent}
              x2={clamped}
              y2={100}
              stroke="rgba(99,102,241,0.4)"
              strokeWidth="0.5"
              strokeDasharray="2,2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            />
          </svg>

          {/* Floating indicator */}
          <motion.div
            className="pointer-events-none absolute flex -translate-x-1/2 flex-col items-center gap-2"
            style={{
              left: `${clamped}%`,
              top: `${(dotYPercent / 100) * 224}px` // Adjust based on SVG height (224px = h-56)
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5, type: 'spring' }}
          >
            {/* Frosted glass tooltip */}
            <div className="rounded-full border border-white/50 bg-white/90 px-4 py-1.5 shadow-lg shadow-indigo-500/20 backdrop-blur-sm dark:border-white/20 dark:bg-slate-800/90">
              <span className="font-mono text-sm font-medium text-slate-800 dark:text-white">
                You are here
              </span>
            </div>

            {/* Pulsating dot */}
            <div className="relative">
              {/* Outer glow rings */}
              <motion.div
                className="absolute -inset-3 rounded-full bg-amber-400/30"
                animate={shouldReduceMotion ? {} : {
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className="absolute -inset-2 rounded-full bg-amber-400/40"
                animate={shouldReduceMotion ? {} : {
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 0.2, 0.6],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.3,
                }}
              />

              {/* Core dot */}
              <motion.div
                className="relative h-4 w-4 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-500/50"
                animate={shouldReduceMotion ? {} : {
                  scale: [0.9, 1.05, 0.9],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {/* Inner highlight */}
                <div className="absolute inset-[3px] rounded-full bg-white/40" />
              </motion.div>
            </div>

            {/* Rarity label below dot */}
            <span className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              {rarityLabel}
            </span>
          </motion.div>

          {/* X-axis labels */}
          <div className="mt-2 flex justify-between px-2 text-xs text-slate-500 dark:text-slate-500">
            <span>Common</span>
            <span>Average</span>
            <span>Unique</span>
          </div>
        </div>

        {/* Verdict section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className={cn(
            'mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6',
            'border border-slate-200/50 bg-gradient-to-r from-slate-50 to-white',
            'dark:border-slate-700/50 dark:from-slate-800/50 dark:to-slate-900/50'
          )}
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Verdict
            </p>
            <p className="mt-1 text-xl font-semibold text-indigo-600 dark:text-indigo-400">
              {verdict}
            </p>
          </div>
          <div className="max-w-sm text-right text-xs text-slate-500 dark:text-slate-400">
            <p>Combined metrics: Gold (hardware), Silver (software), Bronze (network)</p>
            <p className="mt-1">Lie detection ensures spoof resistance.</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
