'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Fingerprint, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useScanFlow } from '@/lib/scan-flow';

/**
 * Premium Scan Button Component
 * Neo-SaaS design with scanner beam animation, double border effect,
 * and expanding state during scan
 */
export function ScanButton() {
  const router = useRouter();
  const { phase, progress, startScan, error } = useScanFlow();

  const scanning = phase === 'collecting' || phase === 'analyzing';
  const hasError = phase === 'error';
  const isComplete = phase === 'complete';

  const progressPercent = useMemo(() => {
    if (progress.total <= 0) return 0;
    if (phase === 'analyzing') return 100;
    return Math.min(100, Math.round((progress.index / progress.total) * 100));
  }, [phase, progress.index, progress.total]);

  const statusLabel = hasError
    ? 'Retry scan'
    : scanning
      ? phase === 'analyzing'
        ? 'Analyzing fingerprint...'
        : progress.dimension || 'Initializing...'
      : isComplete
        ? 'Scan again'
        : 'Scan my fingerprint';

  const handleClick = () => {
    if (!scanning) {
      startScan().catch(() => {});
      router.push('/scan');
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={scanning}
      initial={false}
      animate={{
        width: scanning ? 360 : 280,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={clsx(
        'group relative inline-flex h-[72px] items-center justify-center overflow-hidden rounded-full transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/40',
        hasError
          ? 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600'
          : scanning
            ? 'bg-slate-900 dark:bg-slate-950'
            : 'bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 hover:scale-[1.02] active:scale-[0.98]'
      )}
      style={{
        boxShadow: scanning
          ? '0 20px 50px rgba(99, 102, 241, 0.35), 0 0 0 1px rgba(99, 102, 241, 0.25)'
          : hasError
            ? '0 20px 50px rgba(239, 68, 68, 0.3)'
            : '0 20px 50px rgba(99, 102, 241, 0.35), 0 0 0 1px rgba(139, 92, 246, 0.25)',
      }}
      aria-live="polite"
      aria-label={statusLabel}
    >
      {/* Outer glow ring */}
      <div className={clsx(
        'absolute -inset-[2px] rounded-full opacity-60 blur-sm',
        hasError
          ? 'bg-gradient-to-r from-rose-400 via-red-500 to-orange-400'
          : scanning
            ? 'bg-gradient-to-r from-indigo-400 via-violet-500 to-purple-500'
            : 'bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400'
      )} />

      {/* Inner gradient border */}
      <div className={clsx(
        'absolute inset-[1px] rounded-full',
        hasError
          ? 'bg-gradient-to-b from-rose-600 to-red-700'
          : scanning
            ? 'bg-slate-900 dark:bg-slate-950'
            : 'bg-gradient-to-b from-indigo-400/90 via-violet-500/90 to-purple-500/90'
      )} />

      {/* Glass highlight */}
      <div className="absolute inset-x-8 top-2 h-[40%] rounded-full bg-white/20 blur-xl" />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-3 px-8">
        <AnimatePresence mode="wait">
          {scanning ? (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-3"
            >
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-white/80">
                  {progressPercent}% complete
                </span>
                <span className="text-xs text-white/60 truncate max-w-[200px]">
                  {progress.dimension || 'Processing...'}
                </span>
              </div>
            </motion.div>
          ) : hasError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-white" />
              <span className="text-lg font-semibold text-white">{statusLabel}</span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-3"
            >
              <FingerprintIcon className="h-6 w-6 text-white" />
              <span className="text-lg font-semibold text-white">{statusLabel}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scanner beam animation */}
      {scanning && (
        <div className="absolute inset-[3px] rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-indigo-400/40 to-transparent"
            animate={{
              y: ['-100%', '200%'],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
              initial={{ width: '0%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>
      )}
    </motion.button>
  );
}

/**
 * Animated fingerprint icon with drawing effect
 */
function FingerprintIcon({ className }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      initial={{ pathLength: 0, opacity: 0.5 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      <motion.path
        d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0 }}
      />
      <motion.path
        d="M14 13.12c0 2.38 0 6.38-1 8.88"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />
      <motion.path
        d="M17.29 21.02c.12-.6.43-2.3.5-3.02"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      <motion.path
        d="M2 12a10 10 0 0 1 18-6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      <motion.path
        d="M2 16h.01"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, delay: 0.4 }}
      />
      <motion.path
        d="M21.8 16c.2-2 .131-5.354 0-6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />
      <motion.path
        d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      />
      <motion.path
        d="M8.65 22c.21-.66.45-1.32.57-2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      />
      <motion.path
        d="M14 10.24c0 1.66-.73 3.28-.86 5.76"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      />
      <motion.path
        d="M18 15.5a11 11 0 0 0 .52-4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.9 }}
      />
      <motion.path
        d="M9 12a3 3 0 0 1 3-3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 1 }}
      />
    </motion.svg>
  );
}
