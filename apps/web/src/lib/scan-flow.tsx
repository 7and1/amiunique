'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AnalysisResult } from '@amiunique/core';
import { collectFingerprintWithProgress } from '@amiunique/core';
import { analyzeFingerprint, getSelfIPIntel } from '@/lib/api';
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
  /** Mode used when startScan() is called without an argument (Lite toggle). */
  preferredMode: ScanMode;
  setPreferredMode: (mode: ScanMode) => void;
  durationMs: number | null;
}

// total: 0 = indeterminate; the first collector callback supplies the real total (23 full / 9 lite)
const defaultProgress: ScanProgress = {
  dimension: 'Initializing collectors…',
  index: 0,
  total: 0,
};

const SCAN_RESULT_KEY = 'scanResult';
const SCAN_SUBMISSION_KEY = 'scanSubmissionId';

const ScanFlowContext = createContext<ScanFlowContextValue | null>(null);

export function ScanFlowProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [progress, setProgress] = useState<ScanProgress>(defaultProgress);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ScanMode>('full');
  const [preferredMode, setPreferredModeState] = useState<ScanMode>('full');
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const scanPromiseRef = useRef<Promise<void> | null>(null);
  const preferredModeRef = useRef<ScanMode>('full');

  const setPreferredMode = useCallback((next: ScanMode) => {
    preferredModeRef.current = next;
    setPreferredModeState(next);
  }, []);

  // When analyze responded before the network lookup finished (ip_intel_status
  // 'pending'), the worker keeps warming its KV cache in the background; fetch
  // the summary via /api/ip-intel shortly after and upgrade the stored result.
  const followUpIPIntel = useCallback((analysis: AnalysisResult) => {
    setTimeout(async () => {
      let upgraded: AnalysisResult;
      try {
        const report = await getSelfIPIntel();
        upgraded = report.intelligence
          ? {
              ...analysis,
              ip_intel: { ...report.intelligence, cached: true },
              ip_intel_status: 'available',
            }
          : { ...analysis, ip_intel_status: 'unavailable' };
      } catch {
        upgraded = { ...analysis, ip_intel_status: 'unavailable' };
      }
      setResult(prev => {
        if (!prev || prev.meta.id !== analysis.meta.id) return prev;
        try {
          sessionStorage.setItem(SCAN_RESULT_KEY, JSON.stringify(upgraded));
        } catch {
          /* storage full/unavailable — in-memory state still upgrades */
        }
        return upgraded;
      });
    }, 2500);
  }, []);

  const startScan = useCallback((requestedMode?: ScanMode) => {
    if (scanPromiseRef.current) {
      return scanPromiseRef.current;
    }
    const mode: ScanMode = requestedMode ?? preferredModeRef.current;

    const run = async () => {
      try {
        setMode(mode);
        const startedAt = Date.now();
        setError(null);
        setResult(null);
        setPhase('collecting');
        setProgress(defaultProgress);

        let submissionId: string | undefined;
        if (typeof window !== 'undefined') {
          submissionId = sessionStorage.getItem(SCAN_SUBMISSION_KEY) || window.crypto.randomUUID();
          sessionStorage.setItem(SCAN_SUBMISSION_KEY, submissionId);
          sessionStorage.removeItem(SCAN_RESULT_KEY);
        }

        const fingerprint =
          mode === 'lite'
            ? await import('./collect-lite').then(m =>
                m.collectFingerprintLite((dimension, index, total) =>
                  setProgress({ dimension, index, total })
                )
              )
            : await collectFingerprintWithProgress((dimension, index, total) => {
                setProgress({ dimension, index, total });
              });

        setPhase('analyzing');
        setProgress(prev => ({
          dimension: 'Analyzing fingerprint…',
          index: prev.total,
          total: prev.total,
        }));

        const analysis = await analyzeFingerprint(fingerprint, submissionId);
        setResult(analysis);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(SCAN_RESULT_KEY, JSON.stringify(analysis));
          sessionStorage.removeItem(SCAN_SUBMISSION_KEY);
        }
        saveToHistory(analysis);
        setPhase('complete');
        setDurationMs(Date.now() - startedAt);
        if (analysis.ip_intel_status === 'pending' && !analysis.ip_intel) {
          followUpIPIntel(analysis);
        }
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
  }, [followUpIPIntel]);

  const reset = useCallback(() => {
    setPhase('idle');
    setProgress(defaultProgress);
    setError(null);
    setResult(null);
    setDurationMs(null);
  }, []);

  const value = useMemo(
    () => ({
      phase,
      progress,
      error,
      result,
      startScan,
      reset,
      mode,
      preferredMode,
      setPreferredMode,
      durationMs,
    }),
    [phase, progress, error, result, startScan, reset, mode, preferredMode, setPreferredMode, durationMs]
  );

  return <ScanFlowContext.Provider value={value}>{children}</ScanFlowContext.Provider>;
}

export function useScanFlow() {
  const context = useContext(ScanFlowContext);
  if (!context) {
    throw new Error('useScanFlow must be used within a ScanFlowProvider');
  }
  return context;
}
