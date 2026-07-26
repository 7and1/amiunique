'use client';

import { useEffect, useState } from 'react';
import type { AnalysisResult } from '@amiunique/core';
import { cn } from '@/lib/utils';
import { estimateRarity, type RarityLevel } from '@/components/ui/rarity-badge';

/** Raw addresses must never feed the score, even if present in a legacy payload */
const HIDDEN_KEYS = new Set(['rtc_local_ip', 'rtc_public_ip', 'aux_webrtc_ip']);

const LEVEL_WEIGHTS: Record<RarityLevel, number> = {
  common: 25,
  uncommon: 50,
  rare: 75,
  'very-rare': 85,
  unique: 95,
};

const CATEGORIES = [
  { label: 'Hardware', prefixes: ['hw_'] },
  { label: 'Software', prefixes: ['sys_', 'cap_', 'ch_'] },
  { label: 'Media', prefixes: ['med_'] },
  { label: 'Network', prefixes: ['net_', 'rtc_'] },
];

const severityColor = (score: number) => {
  // Unified cool palette: low scores = lighter/cooler, high scores = deeper purple
  if (score >= 75) return 'from-violet-500 via-purple-500 to-fuchsia-500';
  if (score >= 50) return 'from-indigo-500 via-violet-500 to-purple-500';
  if (score >= 25) return 'from-sky-400 via-indigo-400 to-violet-400';
  return 'from-cyan-400 via-sky-400 to-indigo-400';
};

function verdictFor(score: number, count: number): string {
  if (count === 0) return 'No signals collected in this group.';
  if (score >= 75) return 'Several signals in this group look rare — strong identifying power.';
  if (score >= 50) return 'A mix of common and distinctive signals adds identifying detail.';
  if (score >= 25) return 'Mostly common values that blend into the crowd.';
  return 'Signals in this group look common.';
}

export function ContributionPanel({ details }: { details: AnalysisResult['details'] }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(true);
  }, []);

  const categories = CATEGORIES.map(category => {
    const entries = Object.entries(details).filter(
      ([key]) => !HIDDEN_KEYS.has(key) && category.prefixes.some(prefix => key.startsWith(prefix))
    );
    const score =
      entries.length > 0
        ? Math.round(
            entries.reduce(
              (sum, [key, value]) => sum + LEVEL_WEIGHTS[estimateRarity(key, value)],
              0
            ) / entries.length
          )
        : 0;
    return { label: category.label, score, count: entries.length };
  });

  return (
    <section aria-labelledby="contribution-heading">
      <div className="mb-4">
        <h3 id="contribution-heading" className="text-lg font-semibold">
          Estimated signal contribution
          <span className="ml-2 align-middle text-xs font-normal uppercase tracking-wide text-muted-foreground">
            est.
          </span>
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Scores are heuristic estimates from public browser statistics, not measurements against
          the fingerprint corpus.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {categories.map(category => (
          <article
            key={category.label}
            className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-card dark:border-white/5 dark:bg-white/5"
          >
            <div className="flex items-baseline justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {category.label}
              </p>
              <p className="font-mono text-xs text-muted-foreground">{category.count} signals</p>
            </div>
            <div className="relative mt-6 h-36 w-full overflow-hidden rounded-2xl bg-slate-200/40 dark:bg-slate-800/40">
              <div
                className={cn(
                  'absolute bottom-0 left-0 right-0 rounded-2xl bg-gradient-to-t motion-safe:transition-[height] motion-safe:duration-700 motion-safe:ease-out',
                  severityColor(category.score)
                )}
                style={{ height: revealed ? `${category.score}%` : '0%' }}
              >
                <span className="absolute inset-0 flex items-end justify-center pb-3 font-mono text-3xl font-semibold text-white">
                  {category.score}%
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {verdictFor(category.score, category.count)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
