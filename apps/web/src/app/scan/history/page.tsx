'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, History, Trash2, ArrowRight } from 'lucide-react';
import type { ScanHistoryEntry } from '@/lib/history';
import { readHistory, clearHistory } from '@/lib/history';
import { riskColors } from '@/lib/constants';

export default function ScanHistoryPage() {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  const renderTimestamp = (timestamp: number) => {
    try {
      return new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(timestamp));
    } catch (error) {
      return new Date(timestamp).toLocaleString();
    }
  };

  return (
    <div className="py-16">
      <div className="container mx-auto max-w-5xl px-4 space-y-12">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/60 px-4 py-1 text-sm text-muted-foreground dark:bg-white/10">
            <History className="h-4 w-4" /> Local timeline only
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">Fingerprint history</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Each scan stays inside your browser. Track how your uniqueness shifts after OS updates, VPN changes, or new privacy add-ons.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Shield className="h-4 w-4" /> Stored via localStorage · never uploaded
            </span>
            <span className="inline-flex items-center gap-2">
              <ArrowRight className="h-4 w-4" /> Most recent 20 scans retained
            </span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={history.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:border-slate-200 disabled:text-slate-400"
          >
            <Trash2 className="h-4 w-4" /> Clear history
          </button>
        </header>

        {history.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/40 bg-white/60 p-12 text-center shadow-card dark:border-white/10 dark:bg-white/5">
            <p className="text-lg font-semibold mb-2">No scans yet</p>
            <p className="text-muted-foreground mb-6">Run your first scan to populate this dashboard.</p>
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-white shadow-lg hover:opacity-90"
            >
              Launch scanner
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map(entry => (
              <article
                key={`${entry.id}-${entry.createdAt}`}
                className="rounded-3xl border border-white/30 bg-white/80 p-6 shadow-card dark:border-white/5 dark:bg-white/5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">{renderTimestamp(entry.createdAt)}</p>
                    <p className="text-2xl font-semibold text-foreground">{entry.message}</p>
                    <p className="text-sm text-muted-foreground">
                      {(entry.browser || 'Unknown browser') + ' · ' + (entry.os || 'Unknown OS')}
                    </p>
                  </div>
                  <span
                    className={`badge-pill ${riskColors[entry.trackingRisk] || 'bg-slate-500/15 text-slate-300 border border-slate-500/30'}`}
                  >
                    {entry.trackingRisk.toUpperCase()} RISK
                  </span>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/20 bg-white/60 p-4 dark:border-white/5 dark:bg-white/5">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Uniqueness</p>
                    <p className="mt-1 text-lg font-semibold">{entry.uniqueness}</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-white/60 p-4 dark:border-white/5 dark:bg-white/5">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Gold · Silver</p>
                    <p className="hash-text text-xs mt-2">{entry.hashes.gold.slice(0, 18)}…</p>
                    <p className="hash-text text-xs">{entry.hashes.silver.slice(0, 18)}…</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-white/60 p-4 dark:border-white/5 dark:bg-white/5">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Bronze hash</p>
                    <p className="hash-text text-xs mt-2 break-all">{entry.hashes.bronze}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
