'use client';

import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import type { AnalysisResult } from '@amiunique/core';
import { cn, formatHash } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

interface HashLocksProps {
  hashes: AnalysisResult['hashes'];
  risk: AnalysisResult['result']['tracking_risk'];
  uniquenessDisplay: string;
}

interface LockConfig {
  id: keyof AnalysisResult['hashes'];
  short: string;
  medal: string;
  title: string;
  subtitle: string;
  card: string;
  copyHover: string;
  hashBg: string;
}

const LOCKS: LockConfig[] = [
  {
    id: 'gold',
    short: 'Gold',
    medal: '🥇',
    title: 'Gold Lock',
    subtitle: 'Hardware Fingerprint',
    card: 'border-yellow-400/50 bg-gradient-to-b from-yellow-50 to-white dark:from-yellow-900/20 dark:to-slate-900',
    copyHover: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
    hashBg: 'bg-yellow-100/50 dark:bg-yellow-900/20',
  },
  {
    id: 'silver',
    short: 'Silver',
    medal: '🥈',
    title: 'Silver Lock',
    subtitle: 'Software Fingerprint',
    card: 'border-gray-400/50 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/20 dark:to-slate-900',
    copyHover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
    hashBg: 'bg-gray-100/50 dark:bg-gray-800/20',
  },
  {
    id: 'bronze',
    short: 'Bronze',
    medal: '🥉',
    title: 'Bronze Lock',
    subtitle: 'Full Session Fingerprint',
    card: 'border-orange-400/50 bg-gradient-to-b from-orange-50 to-white dark:from-orange-900/20 dark:to-slate-900',
    copyHover: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
    hashBg: 'bg-orange-100/50 dark:bg-orange-900/20',
  },
];

export function HashLocks({ hashes, risk, uniquenessDisplay }: HashLocksProps) {
  const [copiedLock, setCopiedLock] = useState<string | null>(null);

  const copyHash = async (lock: LockConfig) => {
    await navigator.clipboard.writeText(hashes[lock.id]);
    setCopiedLock(lock.id);
    toast.success(`${lock.short} hash copied`);
    setTimeout(() => setCopiedLock(null), 2000);
  };

  const downloadHashes = (format: 'txt' | 'json') => {
    const payload = {
      hashes,
      risk,
      exact_matches: uniquenessDisplay,
    };
    let content = '';
    let mime = 'text/plain';
    let filename = 'amiunique-hashes.txt';
    if (format === 'json') {
      content = JSON.stringify(payload, null, 2);
      mime = 'application/json';
      filename = 'amiunique-hashes.json';
    } else {
      content = `Gold: ${hashes.gold}\nSilver: ${hashes.silver}\nBronze: ${hashes.bronze}\nRisk: ${risk}\nExact Matches: ${uniquenessDisplay}`;
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <h3 className="text-center text-xl font-semibold sm:text-left">
          Three-Lock Identity Hashes
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => downloadHashes('txt')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-4 w-4" aria-hidden="true" /> TXT
          </button>
          <button
            type="button"
            onClick={() => downloadHashes('json')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-4 w-4" aria-hidden="true" /> JSON
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {LOCKS.map(lock => (
          <div key={lock.id} className={cn('rounded-xl border-2 p-4', lock.card)}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xl">{lock.medal}</span>
              <button
                type="button"
                onClick={() => copyHash(lock)}
                aria-label={`Copy ${lock.title} hash`}
                className={cn('rounded p-1 transition active:scale-95', lock.copyHover)}
              >
                {copiedLock === lock.id ? (
                  <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <div className="mb-1 text-sm font-medium">{lock.title}</div>
            <div className="mb-2 text-xs text-muted-foreground">{lock.subtitle}</div>
            <div className={cn('hash-text rounded p-2 text-xs', lock.hashBg)}>
              {formatHash(hashes[lock.id], 20)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
