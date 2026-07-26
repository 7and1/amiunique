'use client';

import { useEffect } from 'react';
import { THEME_STORAGE_KEY } from './theme-toggle';

const mediaQuery = '(prefers-color-scheme: dark)';

function hasExplicitPreference(): boolean {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark';
}

/** Follows OS color-scheme changes, but only while the user preference is "system". */
export function ThemeWatcher() {
  useEffect(() => {
    const media = window.matchMedia(mediaQuery);

    const applyTheme = (event: MediaQueryList | MediaQueryListEvent) => {
      if (hasExplicitPreference()) return;
      if ('matches' in event) {
        document.documentElement.classList.toggle('dark', event.matches);
      }
    };

    applyTheme(media);

    const listener = (event: MediaQueryListEvent) => applyTheme(event);

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }

    media.addListener(listener);
    return () => media.removeListener(listener);
  }, []);

  return null;
}
