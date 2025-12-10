'use client';

import { useState } from 'react';
import { Share2, Twitter, Linkedin, Link2, Check, Download, Image as ImageIcon } from 'lucide-react';
import type { AnalysisResult } from '@amiunique/core';
import { cn } from '@/lib/utils';

interface SharePanelProps {
  result: AnalysisResult;
  className?: string;
}

/**
 * Social sharing panel for fingerprint results
 * Supports Twitter, LinkedIn, copy link, and download
 */
export function SharePanel({ result, className }: SharePanelProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const shareText = `I tested my browser fingerprint on AmiUnique.io and discovered I have a ${result.result.tracking_risk.toUpperCase()} tracking risk with ${result.result.uniqueness_display} uniqueness. Check your browser privacy!`;
  const shareUrl = 'https://amiunique.io';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  const handleDownloadReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      tracking_risk: result.result.tracking_risk,
      uniqueness: result.result.uniqueness_display,
      hashes: result.hashes,
      dimensions_analyzed: Object.keys(result.details).length,
      lies_detected: Object.values(result.lies).filter(Boolean).length,
      cross_browser_detected: result.result.cross_browser_detected,
    };

    const content = JSON.stringify(report, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amiunique-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyReport = async () => {
    const report = `AmiUnique.io Fingerprint Report
================================
Risk Level: ${result.result.tracking_risk.toUpperCase()}
Uniqueness: ${result.result.uniqueness_display}
Dimensions: ${Object.keys(result.details).length}+

Three-Lock Hashes:
- Gold (Hardware): ${result.hashes.gold.slice(0, 16)}...
- Silver (Software): ${result.hashes.silver.slice(0, 16)}...
- Bronze (Full): ${result.hashes.bronze.slice(0, 16)}...

Test your browser: https://amiunique.io`;

    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <Share2 className="h-4 w-4" />
        Share Results
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Share your results
              </p>
            </div>

            <div className="space-y-1">
              {/* Twitter */}
              <button
                onClick={handleShareTwitter}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
                  <Twitter className="h-4 w-4 text-sky-500" />
                </div>
                Share on Twitter
              </button>

              {/* LinkedIn */}
              <button
                onClick={handleShareLinkedIn}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Linkedin className="h-4 w-4 text-blue-600" />
                </div>
                Share on LinkedIn
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Link2 className="h-4 w-4 text-slate-500" />
                  )}
                </div>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>

              <div className="my-2 h-px bg-slate-200 dark:bg-slate-700" />

              {/* Copy Report */}
              <button
                onClick={handleCopyReport}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <ImageIcon className="h-4 w-4 text-amber-600" />
                </div>
                Copy Report Summary
              </button>

              {/* Download JSON */}
              <button
                onClick={handleDownloadReport}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <Download className="h-4 w-4 text-emerald-600" />
                </div>
                Download Full Report
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
