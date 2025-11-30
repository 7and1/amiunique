import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a hash for display (truncate middle)
 */
export function formatHash(hash: string, length = 16): string {
  if (hash.length <= length) return hash;
  const halfLength = Math.floor(length / 2) - 1;
  return `${hash.slice(0, halfLength)}...${hash.slice(-halfLength)}`;
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Get risk level color class
 */
export function getRiskColor(risk: 'low' | 'medium' | 'high' | 'critical'): string {
  const colors = {
    low: 'text-green-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    critical: 'text-red-500',
  };
  return colors[risk];
}

/**
 * Get risk level badge class
 */
export function getRiskBadgeClass(risk: 'low' | 'medium' | 'high' | 'critical'): string {
  const classes = {
    low: 'risk-badge-low',
    medium: 'risk-badge-medium',
    high: 'risk-badge-high',
    critical: 'risk-badge-critical',
  };
  return `risk-badge ${classes[risk]}`;
}

/**
 * Convert a value to a display string
 */
export function valueToDisplay(value: unknown): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Get dimension category color
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    hardware: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    system: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    capabilities: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    media: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
    network: 'bg-green-500/10 text-green-600 border-green-500/20',
    auxiliary: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  };
  return colors[category] || colors.auxiliary;
}
