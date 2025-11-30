'use client';

import { useEffect } from 'react';

const mediaQuery = '(prefers-color-scheme: dark)';

export function ThemeWatcher() {
  useEffect(() => {
    const media = window.matchMedia(mediaQuery);

    const applyTheme = (event: MediaQueryList | MediaQueryListEvent) => {
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
