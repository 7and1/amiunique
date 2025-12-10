'use client';

import { cn } from '@/lib/utils';

type RarityLevel = 'common' | 'uncommon' | 'rare' | 'very-rare' | 'unique';

interface RarityBadgeProps {
  level: RarityLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const rarityConfig: Record<RarityLevel, { label: string; color: string; bgColor: string; description: string }> = {
  common: {
    label: 'Common',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    description: '>50% of browsers share this value',
  },
  uncommon: {
    label: 'Uncommon',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    description: '10-50% of browsers share this value',
  },
  rare: {
    label: 'Rare',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    description: '1-10% of browsers share this value',
  },
  'very-rare': {
    label: 'Very Rare',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/30',
    description: '<1% of browsers share this value',
  },
  unique: {
    label: 'Unique',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/30',
    description: 'Only your browser has this value',
  },
};

/**
 * Badge showing how rare a fingerprint dimension value is
 */
export function RarityBadge({ level, showLabel = false, size = 'sm', className }: RarityBadgeProps) {
  const config = rarityConfig[level];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        config.bgColor,
        config.color,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className
      )}
      title={config.description}
    >
      <span
        className={cn(
          'inline-block rounded-full',
          size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2',
          level === 'common' && 'bg-slate-400',
          level === 'uncommon' && 'bg-blue-500',
          level === 'rare' && 'bg-purple-500',
          level === 'very-rare' && 'bg-orange-500',
          level === 'unique' && 'bg-red-500'
        )}
      />
      {showLabel && config.label}
    </span>
  );
}

/**
 * Estimate rarity level based on dimension key and value
 * This is a heuristic-based estimation
 */
export function estimateRarity(key: string, value: unknown): RarityLevel {
  const strValue = String(value).toLowerCase();

  // Hash values are typically unique or very rare
  if (key.includes('hash')) {
    return 'unique';
  }

  // Screen resolutions
  if (key.includes('screen')) {
    const commonResolutions = ['1920x1080', '1366x768', '1536x864', '2560x1440', '1440x900', '1280x720'];
    if (commonResolutions.some(r => strValue.includes(r))) {
      return 'common';
    }
    if (strValue.includes('x')) {
      const [w, h] = strValue.split('x').map(Number);
      if (w >= 3840 || h >= 2160) return 'rare'; // 4K+
      if (w <= 800 || h <= 600) return 'very-rare'; // Very old/unusual
    }
    return 'uncommon';
  }

  // CPU cores
  if (key.includes('cpu_cores')) {
    const cores = Number(value);
    if (cores === 4 || cores === 8) return 'common';
    if (cores === 2 || cores === 6 || cores === 12 || cores === 16) return 'uncommon';
    if (cores > 16) return 'rare';
    return 'very-rare';
  }

  // Memory
  if (key.includes('memory')) {
    const mem = Number(value);
    if (mem === 8) return 'common';
    if (mem === 4 || mem === 16) return 'uncommon';
    if (mem >= 32) return 'rare';
    if (mem <= 2) return 'very-rare';
    return 'common';
  }

  // Color depth
  if (key.includes('color_depth')) {
    const depth = Number(value);
    if (depth === 24) return 'common';
    if (depth === 32) return 'uncommon';
    return 'rare';
  }

  // Touch points
  if (key.includes('touch_points')) {
    const points = Number(value);
    if (points === 0) return 'common'; // Desktop
    if (points === 5 || points === 10) return 'common'; // Mobile
    if (points > 10) return 'rare';
    return 'uncommon';
  }

  // WebGL vendors
  if (key.includes('webgl_vendor')) {
    const commonVendors = ['google', 'intel', 'nvidia', 'amd', 'apple', 'arm'];
    if (commonVendors.some(v => strValue.includes(v))) {
      return 'common';
    }
    return 'rare';
  }

  // Platform
  if (key.includes('platform')) {
    const common = ['win32', 'win64', 'macintel', 'linux x86_64', 'linux'];
    if (common.some(p => strValue.includes(p))) return 'common';
    return 'uncommon';
  }

  // Browser/OS detection lies
  if (key.includes('lie_') || key.includes('mismatch')) {
    if (value === true) return 'very-rare';
    return 'common';
  }

  // Timezone
  if (key.includes('timezone')) {
    const commonTz = ['america', 'europe', 'asia', 'australia'];
    if (commonTz.some(tz => strValue.includes(tz))) return 'common';
    return 'uncommon';
  }

  // Booleans
  if (typeof value === 'boolean') {
    return value ? 'uncommon' : 'common';
  }

  // Default
  return 'common';
}
