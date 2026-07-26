'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'au_theme';

function readPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

export function applyThemePreference(preference: ThemePreference) {
  const dark =
    preference === 'dark' ||
    (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

const CYCLE: ThemePreference[] = ['system', 'light', 'dark'];

const LABELS: Record<ThemePreference, string> = {
  system: 'System theme',
  light: 'Light theme',
  dark: 'Dark theme',
};

/** Cycles system → light → dark, persists to localStorage, applies immediately. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPreference(readPreference());
    setMounted(true);
  }, []);

  const cycle = () => {
    const next = CYCLE[(CYCLE.indexOf(preference) + 1) % CYCLE.length];
    setPreference(next);
    if (next === 'system') {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    }
    applyThemePreference(next);
  };

  const Icon = preference === 'dark' ? Moon : preference === 'light' ? Sun : Monitor;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${LABELS[preference]} — click to switch`}
      title={LABELS[preference]}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/50 text-muted-foreground transition-colors hover:text-foreground dark:border-white/10 dark:bg-white/5 ${className}`}
    >
      {/* avoid hydration mismatch: render a stable icon until mounted */}
      {mounted ? <Icon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
    </button>
  );
}
