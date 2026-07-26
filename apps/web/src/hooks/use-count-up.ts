'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from its previous value to `target` with an ease-out curve.
 * Renders instantly when the user prefers reduced motion.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(target);
  const previousRef = useRef(target);

  useEffect(() => {
    const from = previousRef.current;
    previousRef.current = target;

    if (from === target) {
      setValue(target);
      return;
    }

    if (
      typeof window === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
