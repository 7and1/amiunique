'use client';

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { History, X, Trash2 } from 'lucide-react';
import { readHistory, clearHistory, type ScanHistoryEntry } from '@/lib/history';

function shortBrowser(ua: string | undefined): string {
  if (!ua) return 'Unknown browser';
  const m = ua.match(/(Firefox|Edg|OPR|Chrome|Safari)\/[\d.]+/);
  if (!m) return ua.slice(0, 40);
  const names: Record<string, string> = { Edg: 'Edge', OPR: 'Opera' };
  return `${names[m[1]] ?? m[1]} ${m[0].split('/')[1]?.split('.')[0] ?? ''}`.trim();
}

const riskTone: Record<string, string> = {
  low: 'text-emerald-600 dark:text-emerald-400',
  medium: 'text-amber-600 dark:text-amber-400',
  high: 'text-orange-600 dark:text-orange-400',
  critical: 'text-rose-600 dark:text-rose-400',
};

/**
 * Local scan history as a side sheet — data lives in localStorage only
 * and never leaves the browser.
 */
export function ScanHistoryDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [entries, setEntries] = useState<ScanHistoryEntry[]>([]);

  useEffect(() => {
    if (open) setEntries(readHistory());
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 flex w-96 max-w-[92vw] flex-col border-l border-white/10 bg-white/95 shadow-xl backdrop-blur-xl dark:bg-slate-950/95"
          aria-describedby="history-drawer-note"
        >
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <Dialog.Title className="flex items-center gap-2 text-sm font-semibold">
              <History className="h-4 w-4 text-primary-500" />
              Scan history
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close history"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <p id="history-drawer-note" className="px-5 pt-3 text-xs text-muted-foreground">
            Stored in your browser via localStorage — never uploaded.
          </p>
          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {entries.length === 0 && (
              <p className="text-sm text-muted-foreground">No previous scans on this device yet.</p>
            )}
            {entries.map(entry => (
              <div
                key={`${entry.id}-${entry.createdAt}`}
                className="rounded-2xl border border-white/15 bg-white/60 p-4 text-sm dark:border-white/5 dark:bg-white/5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{shortBrowser(entry.browser)}</span>
                  <span className={`text-xs font-semibold uppercase ${riskTone[entry.trackingRisk] ?? ''}`}>
                    {entry.trackingRisk}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString()} · {entry.uniqueness}
                </p>
                <p className="mt-2 truncate font-mono text-[11px] text-muted-foreground" title="Bronze hash">
                  {entry.hashes.bronze.slice(0, 24)}…
                </p>
              </div>
            ))}
          </div>
          {entries.length > 0 && (
            <div className="border-t border-white/10 p-5">
              <button
                type="button"
                onClick={() => {
                  clearHistory();
                  setEntries([]);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Clear history
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
