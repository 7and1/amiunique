'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AnalysisResult } from '@amiunique/core';
import { collectFingerprintWithProgress } from '@amiunique/core';
import { analyzeFingerprint } from '@/lib/api';
import { saveToHistory } from '@/lib/history';

type ScanPhase = 'idle' | 'collecting' | 'analyzing' | 'complete' | 'error';

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
  startScan: () => Promise<void>;
  reset: () => void;
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
  const scanPromiseRef = useRef<Promise<void> | null>(null);

  const startScan = useCallback(() => {
    if (scanPromiseRef.current) {
      return scanPromiseRef.current;
    }

    const run = async () => {
      try {
        setError(null);
        setResult(null);
        setPhase('collecting');
        setProgress(defaultProgress);

        const fingerprint = await collectFingerprintWithProgress((dimension, index, total) => {
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
      } catch (err) {
        console.error('Fingerprint scan failed:', err);
        setError(err instanceof Error ? err.message : 'Unexpected scan error');
        setPhase('error');
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
  }, []);

  const value = useMemo(() => ({ phase, progress, error, result, startScan, reset }), [
    phase,
    progress,
    error,
    result,
    startScan,
    reset,
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
