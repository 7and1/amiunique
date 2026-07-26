'use client';

import { useEffect, useState } from 'react';
import type { AnalysisResult } from '@amiunique/core';
import { useScanFlow } from '@/lib/scan-flow';
import { HeroSection } from '@/components/home/hero-section';
import { ScanExperience } from '@/components/scan/scan-experience';
import { SignalPreviewGrid } from '@/components/home/signal-preview-grid';
import { ValueProps } from '@/components/home/value-props';
import { EducationalArticle } from '@/components/home/educational-article';
import { FAQSection } from '@/components/home/faq-section';

const SCAN_RESULT_KEY = 'scanResult';

/**
 * Single-page experience: hero → click-gated inline scan → result dashboard →
 * live signal preview → value props → article → FAQ. Sections are anchored so
 * the sticky nav and deep links (#scan, #learn, #faq) work.
 */
export function HomeContent() {
  const { phase, result } = useScanFlow();
  const [restored, setRestored] = useState<AnalysisResult | null>(null);

  // Restore the previous result of this browser session — display only, never
  // triggers a scan.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SCAN_RESULT_KEY);
      if (stored) setRestored(JSON.parse(stored) as AnalysisResult);
    } catch {
      sessionStorage.removeItem(SCAN_RESULT_KEY);
    }
  }, []);

  // A fresh scan supersedes the restored copy.
  useEffect(() => {
    if (phase === 'collecting') setRestored(null);
  }, [phase]);

  const activeResult = result ?? restored;

  const scrollToScanProgress = () => {
    // The progress block renders on the next state flush; scroll once it exists.
    setTimeout(() => {
      document.getElementById('scan-live')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'start',
      });
    }, 80);
  };

  return (
    <div className="flex flex-col">
      <div id="scan" className="scroll-mt-24">
        <HeroSection onScanRequest={scrollToScanProgress} />
        <ScanExperience
          activeResult={activeResult}
          isRestored={result === null && restored !== null}
        />
      </div>
      <SignalPreviewGrid result={activeResult} />
      <ValueProps />
      <EducationalArticle />
      <FAQSection />
    </div>
  );
}
