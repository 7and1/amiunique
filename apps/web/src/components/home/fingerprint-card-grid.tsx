'use client';

import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Fingerprint, Cpu, Globe, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FingerprintCard {
  group: 'Hardware' | 'Software' | 'Network' | 'Behavior';
  label: string;
  value: string;
  uniqueness: number; // percentage value 0-100
  status: 'unique' | 'common' | 'flagged';
}

const highlights: FingerprintCard[] = [
  {
    group: 'Hardware',
    label: 'GPU Renderer',
    value: 'Apple M2 Max',
    uniqueness: 0.01,
    status: 'unique',
  },
  {
    group: 'Software',
    label: 'Fonts hash',
    value: 'd7a1b90ffc',
    uniqueness: 0.14,
    status: 'unique',
  },
  {
    group: 'Network',
    label: 'ASN',
    value: 'AS16509 • Amazon.com',
    uniqueness: 22.4,
    status: 'common',
  },
  {
    group: 'Behavior',
    label: 'Timezone drift',
    value: '+00:37 spoof detected',
    uniqueness: 0.08,
    status: 'flagged',
  },
  {
    group: 'Software',
    label: 'UA family',
    value: 'Chrome 130.0 (MacOS 14.5)',
    uniqueness: 18.2,
    status: 'common',
  },
  {
    group: 'Hardware',
    label: 'Display mode',
    value: '3024×1964 @ 120Hz (P3)',
    uniqueness: 0.05,
    status: 'unique',
  },
];

const groupIcons = {
  Hardware: Cpu,
  Software: Fingerprint,
  Network: Globe,
  Behavior: Activity,
};

const groupColors = {
  Hardware: 'from-amber-500/20 to-orange-500/10',
  Software: 'from-indigo-500/20 to-purple-500/10',
  Network: 'from-sky-500/20 to-cyan-500/10',
  Behavior: 'from-emerald-500/20 to-teal-500/10',
};

const groupIconColors = {
  Hardware: 'text-amber-500',
  Software: 'text-indigo-500',
  Network: 'text-sky-500',
  Behavior: 'text-emerald-500',
};

/**
 * Premium fingerprint card with glassmorphism
 */
function Card({ card, index }: { card: FingerprintCard; index: number }) {
  const Icon = groupIcons[card.group];

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        'group relative overflow-hidden rounded-2xl',
        'border border-white/20 dark:border-white/10',
        'bg-white/70 dark:bg-white/5',
        'backdrop-blur-xl',
        'shadow-[0_10px_40px_rgba(15,23,42,0.08)]',
        'transition-shadow duration-300',
        'hover:shadow-[0_20px_50px_rgba(15,23,42,0.15)]'
      )}
    >
      {/* Gradient background based on group */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-50',
        groupColors[card.group]
      )} />

      {/* Hover gradient border effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-purple-500/30" />
        <div className="absolute inset-[1px] rounded-[15px] bg-white/90 dark:bg-slate-900/90" />
      </div>

      {/* Content */}
      <div className="relative p-6">
        {/* Header with group and uniqueness */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', groupIconColors[card.group])} />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {card.group}
            </span>
          </div>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            {card.uniqueness.toFixed(2)}%
          </span>
        </div>

        {/* Label */}
        <p className="mt-4 font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-indigo-500 dark:text-indigo-400">
          {card.label}
        </p>

        {/* Value */}
        <p className="mt-2 truncate text-lg font-semibold text-slate-900 dark:text-white">
          {card.value}
        </p>

        {/* Footer with badge and ratio */}
        <div className="mt-4 flex items-center justify-between">
          <StatusBadge status={card.status} />
          <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
            1 in {Math.round(100 / Math.max(card.uniqueness, 0.01)).toLocaleString()}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

/**
 * Status badge with icon
 */
function StatusBadge({ status }: { status: FingerprintCard['status'] }) {
  const config = {
    unique: {
      icon: AlertTriangle,
      label: 'Unique signal',
      classes: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    },
    common: {
      icon: Shield,
      label: 'Common',
      classes: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/20',
    },
    flagged: {
      icon: AlertTriangle,
      label: 'Flagged',
      classes: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30',
    },
  };

  const { icon: Icon, label, classes } = config[status];

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
      classes
    )}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

/**
 * Fingerprint Card Grid Component
 * Displays highlight fingerprint dimensions with glassmorphism cards
 */
export function FingerprintCardGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {highlights.map((card, index) => (
        <Card key={`${card.group}-${card.label}`} card={card} index={index} />
      ))}
    </div>
  );
}
