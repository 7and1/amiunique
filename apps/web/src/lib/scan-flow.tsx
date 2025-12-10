'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AnalysisResult } from '@amiunique/core';
import { collectFingerprintWithProgress } from '@amiunique/core';
import { analyzeFingerprint } from '@/lib/api';
import { saveToHistory } from '@/lib/history';

type ScanPhase = 'idle' | 'collecting' | 'analyzing' | 'complete' | 'error';
type ScanMode = 'full' | 'lite';

interface ScanProgress {
  dimension: string;
  index: number;
  total: number;
}

interface ScanFlowContextValue {
  phase: ScanPhase;
  progress: ScanProgress;
  error: string | null;
  result: AnalysisResult | null;
  startScan: (mode?: ScanMode) => Promise<void>;
  reset: () => void;
  mode: ScanMode;
  durationMs: number | null;
}

const defaultProgress: ScanProgress = {
  dimension: 'Initializing collectors…',
  index: 0,
  total: 32,
};

const ScanFlowContext = createContext<ScanFlowContextValue | null>(null);

export function ScanFlowProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [progress, setProgress] = useState<ScanProgress>(defaultProgress);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ScanMode>('full');
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const scanPromiseRef = useRef<Promise<void> | null>(null);

  const startScan = useCallback((mode: ScanMode = 'full') => {
    if (scanPromiseRef.current) {
      return scanPromiseRef.current;
    }

    const run = async () => {
      try {
        setMode(mode);
        const startedAt = Date.now();
        setError(null);
        setResult(null);
        setPhase('collecting');
        setProgress(defaultProgress);

        const fingerprint = mode === 'lite'
          ? await import('./collect-lite').then(m => m.collectFingerprintLite((dimension, index, total) => setProgress({ dimension, index, total })))
          : await collectFingerprintWithProgress((dimension, index, total) => {
              setProgress({ dimension, index, total });
            });

        setPhase('analyzing');
        setProgress(prev => ({
          dimension: 'Analyzing fingerprint…',
          index: prev.total,
          total: prev.total,
        }));

        const analysis = await analyzeFingerprint(fingerprint);
        setResult(analysis);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('scanResult', JSON.stringify(analysis));
        }
        saveToHistory(analysis);
        setPhase('complete');
        setDurationMs(Date.now() - startedAt);
      } catch (err) {
        console.error('Fingerprint scan failed:', err);
        setError(err instanceof Error ? err.message : 'Unexpected scan error');
        setPhase('error');
        setDurationMs(null);
      }
    };

    const promise = run().finally(() => {
      scanPromiseRef.current = null;
    });

    scanPromiseRef.current = promise;
    return promise;
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setProgress(defaultProgress);
    setError(null);
    setResult(null);
    setDurationMs(null);
  }, []);

  const value = useMemo(() => ({ phase, progress, error, result, startScan, reset, mode, durationMs }), [
    phase,
    progress,
    error,
    result,
    startScan,
    reset,
    mode,
    durationMs,
  ]);

  return <ScanFlowContext.Provider value={value}>{children}</ScanFlowContext.Provider>;
}

export function useScanFlow() {
  const context = useContext(ScanFlowContext);
  if (!context) {
    throw new Error('useScanFlow must be used within a ScanFlowProvider');
  }
  return context;
}
