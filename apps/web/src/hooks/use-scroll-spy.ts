'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks which of the given section ids is currently in view.
 * Returns the active id (or null before any section has intersected).
 */
export function useScrollSpy(ids: string[], rootMargin = '-45% 0px -50% 0px'): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin }
    );

    const observed: Element[] = [];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
        observed.push(el);
      }
    }

    return () => observer.disconnect();
  }, [ids.join(','), rootMargin]); // eslint-disable-line react-hooks/exhaustive-deps

  return activeId;
}
