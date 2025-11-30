'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AnalysisResult } from '@amiunique/core';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Monitor,
  Cpu,
  Globe,
  Palette,
  Headphones,
  Eye,
} from 'lucide-react';
import { cn, formatHash, getRiskBadgeClass, valueToDisplay, getCategoryColor } from '@/lib/utils';
import { TestResultJsonLd } from '@/components/seo/json-ld';

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['hardware']));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('scanResult');
      if (stored) {
        setResult(JSON.parse(stored));
      } else {
        router.push('/scan');
      }
    }
  }, [router]);

  const copyHash = async (hash: string, type: string) => {
    await navigator.clipboard.writeText(hash);
    setCopiedHash(type);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  if (!result) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading results...</div>
      </div>
    );
  }

  const { hashes, result: analysisResult, details, lies } = result;

  // Group dimensions by category
  const dimensions = {
    hardware: Object.entries(details)
      .filter(([key]) => key.startsWith('hw_'))
      .map(([key, value]) => ({ key, value, label: key.replace('hw_', '').replace(/_/g, ' ') })),
    system: Object.entries(details)
      .filter(([key]) => key.startsWith('sys_'))
      .map(([key, value]) => ({ key, value, label: key.replace('sys_', '').replace(/_/g, ' ') })),
    capabilities: Object.entries(details)
      .filter(([key]) => key.startsWith('cap_'))
      .map(([key, value]) => ({ key, value, label: key.replace('cap_', '').replace(/_/g, ' ') })),
    media: Object.entries(details)
      .filter(([key]) => key.startsWith('med_'))
      .map(([key, value]) => ({ key, value, label: key.replace('med_', '').replace(/_/g, ' ') })),
    network: Object.entries(details)
      .filter(([key]) => key.startsWith('net_'))
      .map(([key, value]) => ({ key, value, label: key.replace('net_', '').replace(/_/g, ' ') })),
  };

  const categoryIcons: Record<string, typeof Monitor> = {
    hardware: Cpu,
    system: Monitor,
    capabilities: Palette,
    media: Headphones,
    network: Globe,
  };

  return (
    <div className="py-8 md:py-12">
      <TestResultJsonLd
        name="Your Browser Fingerprint Analysis Results"
        description={`Browser fingerprint analysis showing ${analysisResult.tracking_risk} tracking risk with ${analysisResult.uniqueness_display} uniqueness across ${Object.keys(details).length}+ dimensions.`}
        result={{
          uniqueness: analysisResult.uniqueness_display,
          risk: analysisResult.tracking_risk,
          dimensionsAnalyzed: Object.keys(details).length,
        }}
      />
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Fingerprint Analysis</h1>
          <p className="text-muted-foreground">
            Analyzed {Object.keys(details).length}+ dimensions
          </p>
          <Link
            href="/scan/history"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm text-muted-foreground transition hover:border-white/60"
          >
            View local history
          </Link>
        </div>

        {/* Main Result Card */}
        <div className="max-w-2xl mx-auto mb-8">
          <div
            className={cn(
              'p-8 rounded-2xl border-2 text-center',
              analysisResult.tracking_risk === 'critical' && 'border-red-500 bg-red-50 dark:bg-red-950/20',
              analysisResult.tracking_risk === 'high' && 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
              analysisResult.tracking_risk === 'medium' && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
              analysisResult.tracking_risk === 'low' && 'border-green-500 bg-green-50 dark:bg-green-950/20'
            )}
          >
            <div className="mb-4">
              {analysisResult.is_unique ? (
                <AlertTriangle className="w-16 h-16 mx-auto text-orange-500" />
              ) : analysisResult.tracking_risk === 'low' ? (
                <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
              ) : (
                <Shield className="w-16 h-16 mx-auto text-primary-500" />
              )}
            </div>

            <h2 className="text-2xl font-bold mb-2">
              {analysisResult.is_unique ? 'You Are Unique!' : 'Fingerprint Detected'}
            </h2>

            <p className="text-lg mb-4">{analysisResult.message}</p>

            <div className="flex items-center justify-center gap-2 mb-4">
              <span className={getRiskBadgeClass(analysisResult.tracking_risk)}>
                {analysisResult.tracking_risk.toUpperCase()} RISK
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{analysisResult.uniqueness_display}</div>
                <div className="text-xs text-muted-foreground">Uniqueness</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{analysisResult.total_fingerprints.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Analyzed</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{analysisResult.hardware_match_count}</div>
                <div className="text-xs text-muted-foreground">Device Matches</div>
              </div>
            </div>

            {analysisResult.cross_browser_detected && (
              <div className="mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Cross-browser tracking detected! This device has been seen with multiple browsers.
              </div>
            )}
          </div>
        </div>

        {/* Three Lock Hashes */}
        <div className="max-w-4xl mx-auto mb-8">
          <h3 className="text-xl font-semibold mb-4 text-center">Three-Lock Identity Hashes</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Gold Lock */}
            <div className="p-4 rounded-xl border-2 border-yellow-400/50 bg-gradient-to-b from-yellow-50 to-white dark:from-yellow-900/20 dark:to-slate-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">🥇</span>
                <button
                  onClick={() => copyHash(hashes.gold, 'gold')}
                  className="p-1 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                >
                  {copiedHash === 'gold' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="text-sm font-medium mb-1">Gold Lock</div>
              <div className="text-xs text-muted-foreground mb-2">Hardware Fingerprint</div>
              <div className="hash-text text-xs bg-yellow-100/50 dark:bg-yellow-900/20 p-2 rounded">
                {formatHash(hashes.gold, 20)}
              </div>
            </div>

            {/* Silver Lock */}
            <div className="p-4 rounded-xl border-2 border-gray-400/50 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/20 dark:to-slate-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">🥈</span>
                <button
                  onClick={() => copyHash(hashes.silver, 'silver')}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {copiedHash === 'silver' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="text-sm font-medium mb-1">Silver Lock</div>
              <div className="text-xs text-muted-foreground mb-2">Software Fingerprint</div>
              <div className="hash-text text-xs bg-gray-100/50 dark:bg-gray-800/20 p-2 rounded">
                {formatHash(hashes.silver, 20)}
              </div>
            </div>

            {/* Bronze Lock */}
            <div className="p-4 rounded-xl border-2 border-orange-400/50 bg-gradient-to-b from-orange-50 to-white dark:from-orange-900/20 dark:to-slate-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">🥉</span>
                <button
                  onClick={() => copyHash(hashes.bronze, 'bronze')}
                  className="p-1 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30"
                >
                  {copiedHash === 'bronze' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="text-sm font-medium mb-1">Bronze Lock</div>
              <div className="text-xs text-muted-foreground mb-2">Full Session Fingerprint</div>
              <div className="hash-text text-xs bg-orange-100/50 dark:bg-orange-900/20 p-2 rounded">
                {formatHash(hashes.bronze, 20)}
              </div>
            </div>
          </div>
        </div>

        {/* Lie Detection */}
        <div className="max-w-4xl mx-auto mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Spoofing Detection
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(lies).map(([key, detected]) => (
              <div
                key={key}
                className={cn(
                  'p-3 rounded-lg border text-center',
                  detected ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-green-300 bg-green-50 dark:bg-green-900/20'
                )}
              >
                {detected ? (
                  <XCircle className="w-5 h-5 mx-auto text-red-500 mb-1" />
                ) : (
                  <CheckCircle className="w-5 h-5 mx-auto text-green-500 mb-1" />
                )}
                <div className="text-xs capitalize">
                  {key.replace('_mismatch', '').replace(/_/g, ' ')}
                </div>
                <div className={cn('text-xs font-medium', detected ? 'text-red-600' : 'text-green-600')}>
                  {detected ? 'Detected' : 'Clean'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dimension Categories */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold mb-4">All Dimensions ({Object.keys(details).length}+)</h3>

          <div className="space-y-4">
            {Object.entries(dimensions).map(([category, dims]) => {
              const Icon = categoryIcons[category] || Monitor;
              const isExpanded = expandedCategories.has(category);

              return (
                <div key={category} className="border rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className={cn(
                      'w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50',
                      getCategoryColor(category)
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium capitalize">{category}</span>
                      <span className="text-xs opacity-70">({dims.length} dimensions)</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t divide-y">
                      {dims.map(({ key, value, label }) => (
                        <div key={key} className="flex items-center justify-between p-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <span className="text-muted-foreground capitalize">{label}</span>
                          <span className="font-mono text-xs max-w-[50%] truncate text-right">
                            {valueToDisplay(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="max-w-4xl mx-auto mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/scan"
            className="px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors text-center"
          >
            Scan Again
          </a>
          <a
            href="/stats"
            className="px-6 py-3 rounded-lg border font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center"
          >
            View Statistics
          </a>
        </div>

        {/* Meta */}
        <div className="max-w-4xl mx-auto mt-8 text-center text-xs text-muted-foreground">
          <p>Scan ID: {result.meta.id}</p>
          <p>Processed in {result.meta.processing_time_ms}ms</p>
        </div>
      </div>
    </div>
  );
}
