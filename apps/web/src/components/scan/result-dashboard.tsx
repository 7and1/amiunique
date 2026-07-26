'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { AnalysisResult } from '@amiunique/core';
import { cn } from '@/lib/utils';
import { FingerprintComparisonPanel } from '@/components/ui/fingerprint-comparison';
import { ContributionPanel } from '@/components/home/contribution-panel';
import { VerdictCard } from './verdict-card';
import { NetworkIdentityCard } from './network-identity-card';
import { HashLocks } from './hash-locks';
import { ConsistencyReport } from './consistency-report';
import { DimensionExplorer } from './dimension-explorer';
import { MitigationTips } from './mitigation-tips';

interface ResultDashboardProps {
  result: AnalysisResult;
  onScanAgain: () => void;
  onOpenHistory: () => void;
}

function RevealSection({
  id,
  index,
  className,
  children,
}: {
  id: string;
  index: number;
  className?: string;
  children: ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      className={cn('scroll-mt-24', className)}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px 0px' }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  );
}

export function ResultDashboard({ result, onScanAgain, onOpenHistory }: ResultDashboardProps) {
  const dimensionCount = Object.keys(result.details).length;

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h2
          id="result-heading"
          tabIndex={-1}
          className="text-3xl font-bold tracking-tight outline-none"
        >
          Your Fingerprint Analysis
        </h2>
        <p className="mt-2 text-muted-foreground">Analyzed {dimensionCount}+ dimensions</p>
      </header>

      <RevealSection id="verdict" index={0} className="mx-auto max-w-2xl">
        <VerdictCard result={result} onScanAgain={onScanAgain} onOpenHistory={onOpenHistory} />
      </RevealSection>

      <RevealSection id="network" index={1} className="mx-auto max-w-4xl">
        <NetworkIdentityCard
          intel={result.ip_intel}
          details={result.details}
          pending={result.ip_intel_status === 'pending'}
        />
      </RevealSection>

      <RevealSection id="comparison" index={2} className="mx-auto max-w-2xl">
        <FingerprintComparisonPanel currentResult={result} />
      </RevealSection>

      <RevealSection id="hashes" index={3} className="mx-auto max-w-4xl">
        <HashLocks
          hashes={result.hashes}
          risk={result.result.tracking_risk}
          uniquenessDisplay={result.result.uniqueness_display}
        />
      </RevealSection>

      <RevealSection id="consistency" index={4} className="mx-auto max-w-4xl">
        <ConsistencyReport report={result.consistency} lies={result.lies} />
      </RevealSection>

      <RevealSection id="dimensions" index={5} className="mx-auto max-w-4xl">
        <DimensionExplorer details={result.details} />
      </RevealSection>

      <RevealSection id="tips" index={6} className="mx-auto max-w-6xl space-y-8">
        <MitigationTips />
        <ContributionPanel details={result.details} />
      </RevealSection>

      <footer className="mx-auto max-w-4xl text-center text-xs text-muted-foreground">
        <p>Scan ID: {result.meta.id}</p>
        <p>Processed in {result.meta.processing_time_ms}ms</p>
      </footer>
    </div>
  );
}
