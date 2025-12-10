'use client';

import type { AnalysisResult } from '@amiunique/core';

const HISTORY_KEY = 'scanHistory';
const MAX_HISTORY = 20;

export interface ScanHistoryEntry {
  id: string;
  createdAt: number;
  uniqueness: string;
  trackingRisk: string;
  message: string;
  browser?: string;
  os?: string;
  hashes: {
    gold: string;
    silver: string;
    bronze: string;
  };
}

export function readHistory(): ScanHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScanHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read scan history', error);
    return [];
  }
}

export function saveToHistory(result: AnalysisResult) {
  if (typeof window === 'undefined') return;
  const entry: ScanHistoryEntry = {
    id: result.hashes.bronze,
    createdAt: Date.now(),
    uniqueness: result.result.uniqueness_display,
    trackingRisk: result.result.tracking_risk,
    message: result.result.message,
    browser: result.details?.sys_user_agent,
    os: result.details?.sys_platform,
    hashes: {
      gold: result.hashes.gold,
      silver: result.hashes.silver,
      bronze: result.hashes.bronze,
    },
  };

  const current = readHistory().filter(item => item.id !== entry.id);
  current.unshift(entry);
  const trimmed = current.slice(0, MAX_HISTORY);

  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to persist scan history', error);
  }
}

export function clearHistory() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(HISTORY_KEY);
}

/**
 * Get the most recent previous scan (excluding the current one)
 */
export function getPreviousScan(currentBronzeHash: string): ScanHistoryEntry | null {
  const history = readHistory();
  // Find first entry that's not the current scan
  return history.find(entry => entry.id !== currentBronzeHash) ?? null;
}

/**
 * Compare two fingerprint results and identify changed dimensions
 */
export interface FingerprintComparison {
  hashesChanged: {
    gold: boolean;
    silver: boolean;
    bronze: boolean;
  };
  previousScan: ScanHistoryEntry;
  timeSinceLastScan: number;
  summary: 'identical' | 'minor_changes' | 'significant_changes' | 'device_changed';
}

export function compareWithPrevious(
  current: AnalysisResult,
  previous: ScanHistoryEntry
): FingerprintComparison {
  const goldChanged = current.hashes.gold !== previous.hashes.gold;
  const silverChanged = current.hashes.silver !== previous.hashes.silver;
  const bronzeChanged = current.hashes.bronze !== previous.hashes.bronze;

  const timeSinceLastScan = Date.now() - previous.createdAt;

  let summary: FingerprintComparison['summary'];
  if (!goldChanged && !silverChanged && !bronzeChanged) {
    summary = 'identical';
  } else if (goldChanged) {
    summary = 'device_changed';
  } else if (silverChanged) {
    summary = 'significant_changes';
  } else {
    summary = 'minor_changes';
  }

  return {
    hashesChanged: {
      gold: goldChanged,
      silver: silverChanged,
      bronze: bronzeChanged,
    },
    previousScan: previous,
    timeSinceLastScan,
    summary,
  };
}
