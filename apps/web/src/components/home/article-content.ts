/**
 * Data arrays for the homepage educational article.
 * Rendered by components/home/educational-article.tsx.
 * Every statistic here must carry a real, linkable source.
 */

import type { LucideIcon } from 'lucide-react';
import { Laptop, Smartphone } from 'lucide-react';

// Maintained by hand: bump ARTICLE_DATE_MODIFIED when the article content
// meaningfully changes. Used by the TechArticle JSON-LD on the homepage.
export const ARTICLE_DATE_PUBLISHED = '2026-07-26';
export const ARTICLE_DATE_MODIFIED = '2026-07-26';

export interface UniquenessStatRow {
  deviceType: string;
  icon: LucideIcon;
  iconClass: string;
  rate: string;
  rateClass: string;
  sourceLabel: string;
  sourceUrl: string;
}

export const uniquenessStats: UniquenessStatRow[] = [
  {
    deviceType: 'Desktop PC',
    icon: Laptop,
    iconClass: 'text-indigo-500',
    rate: '35.7%',
    rateClass: 'text-indigo-600 dark:text-indigo-400',
    sourceLabel: 'INRIA Study',
    sourceUrl: 'https://dl.acm.org/doi/fullHtml/10.1145/3178876.3186097',
  },
  {
    deviceType: 'Mobile Devices',
    icon: Smartphone,
    iconClass: 'text-cyan-500',
    rate: '18.5%',
    rateClass: 'text-cyan-600 dark:text-cyan-400',
    sourceLabel: 'INRIA Study',
    sourceUrl: 'https://dl.acm.org/doi/fullHtml/10.1145/3178876.3186097',
  },
  {
    deviceType: 'iPhone',
    icon: Smartphone,
    iconClass: 'text-slate-500',
    rate: '33%',
    rateClass: 'text-slate-600 dark:text-slate-400',
    sourceLabel: 'Slido Research',
    sourceUrl:
      'https://medium.com/slido-dev-blog/we-collected-500-000-browser-fingerprints-here-is-what-we-found-82c319464dc9',
  },
];

export interface TrackingHarm {
  title: string;
  body: string;
  dotClass: string;
}

export const trackingHarms: TrackingHarm[] = [
  {
    title: 'Cross-site tracking',
    body: 'Advertisers can follow you across the entire internet, even without cookies',
    dotClass: 'bg-rose-500',
  },
  {
    title: 'Price discrimination',
    body: 'Some sites show different prices based on your device and location profile',
    dotClass: 'bg-amber-500',
  },
  {
    title: 'Account linking',
    body: 'Your "anonymous" browsing can be connected to your real identity',
    dotClass: 'bg-purple-500',
  },
  {
    title: 'Bypassing consent',
    body: "Unlike cookies, fingerprinting doesn't require your permission under most regulations",
    dotClass: 'bg-indigo-500',
  },
];

export interface LockTier {
  name: string;
  stability: string;
  body: string;
  cardClass: string;
  titleClass: string;
  badgeClass: string;
  bodyClass: string;
  iconClass: string;
}

export const lockTiers: LockTier[] = [
  {
    name: 'Gold Lock (Hardware)',
    stability: 'Most Stable',
    body: 'Canvas rendering, WebGL signatures, audio processing patterns, GPU characteristics. These survive browser reinstalls and even persist across different browsers on the same device.',
    cardClass:
      'rounded-2xl bg-amber-50 dark:bg-amber-500/10 p-5 border border-amber-200 dark:border-amber-500/20',
    titleClass: 'font-semibold text-amber-700 dark:text-amber-400',
    badgeClass:
      'text-xs bg-amber-200 dark:bg-amber-500/30 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full',
    bodyClass: 'text-sm text-amber-700 dark:text-amber-300',
    iconClass: 'text-amber-500',
  },
  {
    name: 'Silver Lock (Software)',
    stability: 'Medium Stability',
    body: 'Installed fonts, browser plugins, language settings, timezone, screen resolution. These change when you update your browser or OS.',
    cardClass:
      'rounded-2xl bg-slate-100 dark:bg-slate-700/50 p-5 border border-slate-200 dark:border-slate-600',
    titleClass: 'font-semibold text-slate-700 dark:text-slate-300',
    badgeClass:
      'text-xs bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full',
    bodyClass: 'text-sm text-slate-600 dark:text-slate-400',
    iconClass: 'text-slate-500',
  },
  {
    name: 'Bronze Lock (Network)',
    stability: 'Session-Specific',
    body: 'IP address, ASN (your internet provider), TLS cipher suites, connection timing. These change when you switch networks or use a VPN.',
    cardClass:
      'rounded-2xl bg-orange-50 dark:bg-orange-500/10 p-5 border border-orange-200 dark:border-orange-500/20',
    titleClass: 'font-semibold text-orange-700 dark:text-orange-400',
    badgeClass:
      'text-xs bg-orange-200 dark:bg-orange-500/30 text-orange-800 dark:text-orange-300 px-2 py-0.5 rounded-full',
    bodyClass: 'text-sm text-orange-700 dark:text-orange-300',
    iconClass: 'text-orange-500',
  },
];

export interface MitigationTip {
  title: string;
  desc: string;
}

export const mitigationTips: MitigationTip[] = [
  {
    title: 'Use Firefox with Enhanced Tracking Protection',
    desc: 'Firefox actively resists fingerprinting attempts. Enable "Strict" mode in privacy settings.',
  },
  {
    title: 'Try the Tor Browser for sensitive browsing',
    desc: 'Tor standardizes many fingerprint signals, making you blend in with other Tor users.',
  },
  {
    title: 'Keep your browser updated',
    desc: 'Updates often include fingerprinting countermeasures. Chrome and Safari are improving too.',
  },
  {
    title: 'Be mindful of browser extensions',
    desc: 'Each extension you install can make your fingerprint more unique. Use sparingly.',
  },
  {
    title: 'Consider using multiple browsers',
    desc: 'Use different browsers for different activities to compartmentalize your digital identity.',
  },
  {
    title: 'Understand your baseline first',
    desc: 'Run our scan to see exactly what makes you unique - knowledge is power.',
  },
];

export interface SourceLink {
  label: string;
  url: string;
}

export const sources: SourceLink[] = [
  {
    label:
      'INRIA/Inria: "Hiding in the Crowd: An Analysis of the Effectiveness of Browser Fingerprinting at Large Scale"',
    url: 'https://dl.acm.org/doi/fullHtml/10.1145/3178876.3186097',
  },
  {
    label: 'Slido Engineering: "We\'ve Analysed 500,000 Browser Fingerprints"',
    url: 'https://medium.com/slido-dev-blog/we-collected-500-000-browser-fingerprints-here-is-what-we-found-82c319464dc9',
  },
  {
    label: 'AmIUnique.org - Original browser fingerprinting research project',
    url: 'https://amiunique.org/',
  },
];
