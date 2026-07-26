'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BarChart3, Cpu, Fingerprint, Globe } from 'lucide-react';
import type { AnalysisResult } from '@amiunique/core';
import { getBrowserDistribution, getScreenDistribution } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type SignalGroup = 'Hardware' | 'Software' | 'Network' | 'Corpus';

interface SignalCard {
  group: SignalGroup;
  label: string;
  value: string;
  detail?: string;
}

type DataTag = 'Your live signals' | 'Live corpus data' | 'Sample data';

const groupIcons: Record<SignalGroup, typeof Cpu> = {
  Hardware: Cpu,
  Software: Fingerprint,
  Network: Globe,
  Corpus: BarChart3,
};

const groupColors: Record<SignalGroup, string> = {
  Hardware: 'from-amber-500/20 to-orange-500/10',
  Software: 'from-indigo-500/20 to-purple-500/10',
  Network: 'from-sky-500/20 to-cyan-500/10',
  Corpus: 'from-emerald-500/20 to-teal-500/10',
};

const groupIconColors: Record<SignalGroup, string> = {
  Hardware: 'text-amber-500',
  Software: 'text-indigo-500',
  Network: 'text-sky-500',
  Corpus: 'text-emerald-500',
};

// Generic fallback shown only when the corpus API is unreachable.
// Deliberately non-specific — no fabricated hardware or invented counts.
const sampleCards: SignalCard[] = [
  {
    group: 'Software',
    label: 'Most common browser',
    value: 'Chrome',
    detail: 'Typical corpus leader',
  },
  {
    group: 'Hardware',
    label: 'Most common screen',
    value: '1920×1080',
    detail: 'Typical corpus leader',
  },
  {
    group: 'Corpus',
    label: 'Total corpus',
    value: '—',
    detail: 'Live data unavailable',
  },
];

function buildResultCards(result: AnalysisResult): SignalCard[] {
  const d = result.details;
  const cards: SignalCard[] = [
    { group: 'Hardware', label: 'GPU renderer', value: d.hw_webgl_renderer },
    {
      group: 'Network',
      label: 'Network',
      value: d.net_asn_org ?? '',
      detail: d.net_country ? `Country: ${d.net_country}` : undefined,
    },
    { group: 'Software', label: 'Timezone', value: d.sys_timezone },
    {
      group: 'Hardware',
      label: 'Screen',
      value:
        d.hw_screen_width && d.hw_screen_height
          ? `${d.hw_screen_width}×${d.hw_screen_height} @ ${d.hw_pixel_ratio}x`
          : '',
    },
    {
      group: 'Software',
      label: 'Fonts hash',
      value: d.sys_fonts_hash ? d.sys_fonts_hash.slice(0, 10) : '',
    },
    { group: 'Software', label: 'Platform', value: d.sys_platform },
  ];
  return cards.filter(card => card.value);
}

function Card({
  card,
  index,
  reduceMotion,
}: {
  card: SignalCard;
  index: number;
  reduceMotion: boolean;
}) {
  const Icon = groupIcons[card.group];

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.2 } }}
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
      <div
        className={cn('absolute inset-0 bg-gradient-to-br opacity-50', groupColors[card.group])}
      />
      <div className="relative p-6">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', groupIconColors[card.group])} />
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {card.group}
          </span>
        </div>
        <p className="mt-4 font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-indigo-500 dark:text-indigo-400">
          {card.label}
        </p>
        <p className="mt-2 truncate text-lg font-semibold text-slate-900 dark:text-white">
          {card.value}
        </p>
        {card.detail && (
          <p className="mt-2 font-mono text-xs text-slate-500 dark:text-slate-400">{card.detail}</p>
        )}
      </div>
    </motion.article>
  );
}

/**
 * Signal Preview Grid
 * With a scan result: shows the visitor's real signals.
 * Without one: shows live corpus aggregates, or clearly-tagged
 * generic samples when the API is unreachable. Never fabricated data.
 */
export function SignalPreviewGrid({ result }: { result?: AnalysisResult | null }) {
  const reduceMotion = useReducedMotion() ?? false;
  const [corpusCards, setCorpusCards] = useState<SignalCard[] | null>(null);
  const [corpusTag, setCorpusTag] = useState<DataTag>('Live corpus data');
  const [loading, setLoading] = useState(!result);

  useEffect(() => {
    if (result) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([getBrowserDistribution(5), getScreenDistribution(5)])
      .then(([browsers, screens]) => {
        if (cancelled) return;
        const cards: SignalCard[] = [];
        const topBrowsers = browsers.data?.distribution ?? [];
        const topScreens = screens.data?.distribution ?? [];
        topBrowsers.slice(0, 2).forEach((item, i) => {
          if (!item.name) return;
          cards.push({
            group: 'Software',
            label: i === 0 ? 'Most common browser' : '#2 browser',
            value: item.name,
            detail: `${item.percentage}% of corpus`,
          });
        });
        topScreens.slice(0, 2).forEach((item, i) => {
          if (!item.resolution) return;
          cards.push({
            group: 'Hardware',
            label: i === 0 ? 'Most common screen' : '#2 screen',
            value: item.resolution,
            detail: `${item.percentage}% of corpus`,
          });
        });
        if (browsers.data?.total) {
          cards.push({
            group: 'Corpus',
            label: 'Total corpus',
            value: browsers.data.total.toLocaleString(),
            detail: 'Fingerprints analyzed',
          });
        }
        if (cards.length > 0) {
          setCorpusCards(cards);
          setCorpusTag('Live corpus data');
        } else {
          setCorpusCards(sampleCards);
          setCorpusTag('Sample data');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setCorpusCards(sampleCards);
        setCorpusTag('Sample data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [result]);

  const cards = result ? buildResultCards(result) : (corpusCards ?? []);
  const tag: DataTag = result ? 'Your live signals' : corpusTag;

  return (
    <div>
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
          tag === 'Sample data'
            ? 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
        )}
      >
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            tag === 'Sample data' ? 'bg-slate-400' : 'bg-emerald-400'
          )}
          aria-hidden="true"
        />
        {tag}
      </span>
      {!result && loading ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/20 bg-white/70 p-6 dark:border-white/10 dark:bg-white/5"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-4 h-3 w-28" />
              <Skeleton className="mt-3 h-6 w-36" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card, index) => (
            <Card
              key={`${card.group}-${card.label}`}
              card={card}
              index={index}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      )}
    </div>
  );
}
