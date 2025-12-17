import {
  Code2,
  Globe,
  Boxes,
  Server,
  Zap,
  Shield,
  Clock,
  Terminal,
  Copy,
  BookOpen,
  Cpu,
  Lock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { HowToJsonLd } from '@/components/seo/json-ld';

export const metadata = {
  title: 'Developer Documentation | AmiUnique.io',
  description:
    'Complete API reference and integration guide for AmiUnique.io browser fingerprinting platform. 80+ dimensions, edge-first architecture, sub-100ms global latency.',
};

const integrationSteps = [
  {
    name: 'Install the SDK',
    text: 'Add @amiunique/core to your project using pnpm, npm, or yarn package manager.',
  },
  {
    name: 'Collect fingerprint',
    text: 'Use collectFingerprint() to gather 80+ browser dimensions client-side.',
  },
  {
    name: 'Submit to API',
    text: 'POST the collected fingerprint data to https://api.amiunique.io/api/analyze',
  },
  {
    name: 'Process response',
    text: 'Receive Three-Lock hashes (Gold, Silver, Bronze) and uniqueness metrics for your application.',
  },
];

const endpoints = [
  {
    method: 'POST',
    path: '/api/analyze',
    description: 'Submit fingerprint payload and receive Three-Lock hashes with uniqueness metrics.',
    response: `{
  "success": true,
  "data": {
    "hardware_hash": "a1b2c3...",  // Gold Lock
    "software_hash": "d4e5f6...",  // Silver Lock
    "full_hash": "g7h8i9...",      // Bronze Lock
    "uniqueness": {
      "hardware": 0.0012,
      "software": 0.0089,
      "overall": 0.0003
    },
    "verdict": "highly_unique"
  }
}`,
  },
  {
    method: 'POST',
    path: '/api/deletion',
    description: 'Queue GDPR/CCPA deletion for Gold/Silver/Bronze hashes and get a receipt.',
    response: `{
  "success": true,
  "data": {
    "id": "req_bronze_123",
    "status": "pending",
    "created_at": 1701234567890,
    "sla_hours": 24
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/stats',
    description: 'Global counters including total fingerprints, unique sessions, and device counts.',
    response: `{
  "success": true,
  "data": {
    "total_fingerprints": 1234567,
    "unique_sessions": 892341,
    "unique_devices": 456789,
    "updated_at": 1701234567890
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/stats/browsers?limit=10',
    description: 'Browser distribution with counts and percentages for dashboard visualizations.',
    response: `{
  "success": true,
  "data": {
    "distribution": [
      { "name": "Chrome", "count": 45231, "percentage": "67.2" },
      { "name": "Firefox", "count": 12453, "percentage": "18.5" }
    ],
    "total": 67312
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/stats/daily?days=30',
    description: 'Time-series data for throughput trends and unique device tracking.',
    response: `{
  "success": true,
  "data": {
    "trends": [
      { "date": "2024-01-15", "total_visits": 4521, "unique_devices": 3892 }
    ],
    "period_days": 30
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/stats/os?limit=10',
    description: 'Operating system distribution across all analyzed fingerprints.',
    response: `{ "success": true, "data": { "distribution": [...] } }`,
  },
  {
    method: 'GET',
    path: '/api/stats/countries?limit=20',
    description: 'Geographic distribution based on visitor location data.',
    response: `{ "success": true, "data": { "distribution": [...] } }`,
  },
  {
    method: 'GET',
    path: '/api/stats/screens?limit=15',
    description: 'Screen resolution distribution for viewport analysis.',
    response: `{ "success": true, "data": { "distribution": [...] } }`,
  },
  {
    method: 'GET',
    path: '/api/health',
    description: 'Health check endpoint for monitoring and uptime verification.',
    response: `{
  "status": "healthy",
  "timestamp": 1701234567890,
  "latency_ms": 2
}`,
  },
];

const collectorSnippet = `import { collectFingerprint } from '@amiunique/core';

// Collect all 80+ dimensions
const fingerprint = await collectFingerprint();

// Submit to API
const response = await fetch('https://api.amiunique.io/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(fingerprint),
});

const { data } = await response.json();

console.log('Hardware Hash (Gold):', data.hardware_hash);
console.log('Software Hash (Silver):', data.software_hash);
console.log('Full Hash (Bronze):', data.full_hash);
console.log('Uniqueness:', data.uniqueness.overall * 100 + '%');`;

const dimensionCategories = [
  {
    name: 'Hardware & Rendering',
    count: 20,
    examples: ['Canvas hash', 'WebGL renderer', 'Audio fingerprint', 'GPU vendor', 'Screen dimensions'],
  },
  {
    name: 'System & OS',
    count: 15,
    examples: ['Platform', 'User-Agent', 'Timezone', 'Installed fonts', 'Intl APIs'],
  },
  {
    name: 'Browser Capabilities',
    count: 15,
    examples: ['Storage APIs', 'Web Workers', 'WASM support', 'Permissions', 'DeviceMemory'],
  },
  {
    name: 'Media Codecs',
    count: 10,
    examples: ['H.264', 'H.265', 'VP8', 'VP9', 'AV1', 'Opus', 'AAC'],
  },
  {
    name: 'Network Edge',
    count: 15,
    examples: ['ASN', 'TLS cipher', 'HTTP protocol', 'IP type', 'Server location'],
  },
  {
    name: 'Behavior & Lies',
    count: 5,
    examples: ['Timezone consistency', 'WebGL spoofing', 'Canvas noise', 'UA mismatch'],
  },
];

export default function DevelopersPage() {
  return (
    <>
      <HowToJsonLd
        name="How to Integrate Browser Fingerprinting with AmiUnique.io"
        description="Step-by-step guide to integrate browser fingerprinting into your application using the AmiUnique.io SDK and API."
        steps={integrationSteps}
      />
      <div className="py-16">
        <div className="container mx-auto max-w-6xl px-4 space-y-16">
        {/* Hero Header */}
        <header className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Code2 className="h-4 w-4" /> Edge-first fingerprint API
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
            Developer Documentation
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Integrate browser fingerprinting into your applications with our open-source SDK and
            globally distributed API. Collect 80+ dimensions and verify uniqueness in under 100ms
            from anywhere in the world.
          </p>
        </header>

        {/* Key Features */}
        <section className="grid gap-4 md:grid-cols-4">
          {[
            {
              icon: Zap,
              label: 'Sub-100ms latency',
              value: '~80ms',
              color: 'text-amber-500',
              bg: 'from-amber-500/10 to-orange-500/5',
            },
            {
              icon: Globe,
              label: 'Global coverage',
              value: 'Worldwide',
              color: 'text-sky-500',
              bg: 'from-sky-500/10 to-cyan-500/5',
            },
            {
              icon: Cpu,
              label: 'Dimensions collected',
              value: '80+',
              color: 'text-indigo-500',
              bg: 'from-indigo-500/10 to-purple-500/5',
            },
            {
              icon: Shield,
              label: 'Rate limiting',
              value: '10 req/min',
              color: 'text-emerald-500',
              bg: 'from-emerald-500/10 to-teal-500/5',
            },
          ].map((feat) => (
            <div
              key={feat.label}
              className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feat.bg} opacity-50`} />
              <div className="relative">
                <feat.icon className={`h-5 w-5 ${feat.color}`} />
                <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{feat.value}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{feat.label}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Quickstart */}
        <section className="rounded-3xl border border-white/20 bg-white/80 p-8 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500">
              <Terminal className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
                Quickstart
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Get started in 5 minutes
              </h2>
            </div>
          </div>

          {/* Step 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
                1
              </span>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Install the collector SDK
              </h3>
            </div>
            <div className="relative">
              <pre className="rounded-2xl bg-slate-900 p-6 text-sm text-slate-100 overflow-x-auto">
                <code>pnpm add @amiunique/core</code>
              </pre>
              <button
                className="absolute right-4 top-4 rounded-lg bg-slate-800 p-2 text-slate-400 hover:text-white transition-colors"
                aria-label="Copy command"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
                2
              </span>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Collect and analyze fingerprints
              </h3>
            </div>
            <div className="relative">
              <pre className="rounded-2xl bg-slate-900 p-6 text-sm text-slate-100 overflow-x-auto whitespace-pre-wrap">
                <code>{collectorSnippet}</code>
              </pre>
              <button
                className="absolute right-4 top-4 rounded-lg bg-slate-800 p-2 text-slate-400 hover:text-white transition-colors"
                aria-label="Copy code"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Collectors run entirely in the browser. The normalized payload
              is then POSTed to the Worker API. Response includes gold/silver/bronze hashes,
              uniqueness verdicts, and metadata for UI display.
            </p>
          </div>
        </section>

        {/* Three-Lock System */}
        <section className="rounded-3xl border border-white/20 bg-white/80 p-8 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-500 dark:text-amber-400">
                Architecture
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Three-Lock Hash System
              </h2>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Gold Lock',
                subtitle: 'Hardware fingerprint',
                description:
                  'Device-level identity based on GPU, screen, audio context, and hardware capabilities. Survives browser reinstalls.',
                stability: 'Most stable',
                color: 'from-amber-500 to-yellow-500',
                border: 'border-amber-500/30',
              },
              {
                name: 'Silver Lock',
                subtitle: 'Software fingerprint',
                description:
                  'Browser-level identity combining plugins, fonts, feature flags, and rendering behavior. Tied to browser installation.',
                stability: 'Stable',
                color: 'from-slate-400 to-slate-500',
                border: 'border-slate-400/30',
              },
              {
                name: 'Bronze Lock',
                subtitle: 'Full fingerprint',
                description:
                  'Session-level identity including network factors (IP, ASN, TLS) and all dimensions. Most granular tracking.',
                stability: 'Session-bound',
                color: 'from-orange-600 to-amber-700',
                border: 'border-orange-500/30',
              },
            ].map((lock) => (
              <div
                key={lock.name}
                className={`rounded-2xl border ${lock.border} bg-white/60 p-6 dark:bg-slate-800/60`}
              >
                <div
                  className={`inline-flex rounded-xl bg-gradient-to-r ${lock.color} px-3 py-1 text-xs font-bold text-white`}
                >
                  {lock.name}
                </div>
                <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
                  {lock.subtitle}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{lock.description}</p>
                <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-500">
                  Stability: {lock.stability}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Dimension Categories */}
        <section className="rounded-3xl border border-white/20 bg-white/80 p-8 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500">
              <Boxes className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-500 dark:text-sky-400">
                Collectors
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                80+ Fingerprint Dimensions
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dimensionCategories.map((cat) => (
              <div
                key={cat.name}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{cat.name}</h3>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                    {cat.count}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {cat.examples.map((ex) => (
                    <span
                      key={ex}
                      className="rounded-md bg-white px-2 py-1 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* API Reference */}
        <section className="rounded-3xl border border-white/20 bg-white/80 p-8 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500">
                <Server className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">
                  Reference
                </p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">API Endpoints</h2>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Base URL</p>
              <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                https://api.amiunique.io
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {endpoints.map((endpoint) => (
              <details
                key={endpoint.path}
                className="group rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              >
                <summary className="flex cursor-pointer items-center justify-between p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                        endpoint.method === 'POST'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400'
                      }`}
                    >
                      {endpoint.method}
                    </span>
                    <span className="font-mono text-sm text-slate-900 dark:text-white">
                      {endpoint.path}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
                </summary>
                <div className="border-t border-slate-100 p-4 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400">{endpoint.description}</p>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Response Example
                  </p>
                  <pre className="mt-2 rounded-xl bg-slate-900 p-4 text-xs text-slate-100 overflow-x-auto">
                    <code>{endpoint.response}</code>
                  </pre>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* SDK Info Cards */}
        <section className="grid gap-6 md:grid-cols-2">
          {[
            {
              title: 'TypeScript Support',
              description:
                'Full type definitions included. Types mirror packages/core/src/types.ts for end-to-end type safety.',
              icon: BookOpen,
              color: 'from-indigo-500 to-purple-500',
            },
            {
              title: 'Hash Stability',
              description:
                'Keep payload field ordering stable to avoid hash drift. The SDK handles normalization automatically.',
              icon: Shield,
              color: 'from-emerald-500 to-teal-500',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80"
            >
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.color}`}
              >
                <card.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{card.description}</p>
            </div>
          ))}
        </section>

        {/* Rate Limits */}
        <section className="rounded-3xl border border-white/20 bg-white/80 p-8 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose-500 dark:text-rose-400">
                Limits
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Rate Limiting</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                    Endpoint
                  </th>
                  <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                    Limit
                  </th>
                  <th className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                    Window
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { endpoint: '/api/analyze', limit: '10 requests', window: '60 seconds' },
                  { endpoint: '/api/stats/*', limit: '60 requests', window: '60 seconds' },
                  { endpoint: '/api/health', limit: '120 requests', window: '60 seconds' },
                ].map((row) => (
                  <tr
                    key={row.endpoint}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="py-3 px-4 font-mono text-slate-900 dark:text-white">
                      {row.endpoint}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{row.limit}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{row.window}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Rate limits are per-IP and enforced at the edge. Exceeding limits returns{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
              429 Too Many Requests
            </code>
            .
          </p>
        </section>

        {/* CTA */}
        <section className="rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-white">Need enterprise features?</h2>
          <p className="mt-2 text-slate-300">
            Turnstile protection, custom retention policies, dedicated export jobs, and SLA
            guarantees.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a
              href="mailto:partners@amiunique.io"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-semibold text-slate-900 shadow-lg transition-all hover:shadow-xl"
            >
              Contact Engineering
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="https://github.com/amiunique/core"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Code2 className="h-4 w-4" />
              View on GitHub
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            {['SOC 2 compliant', 'GDPR ready', '99.9% uptime SLA'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {item}
              </span>
            ))}
          </div>
        </section>
        </div>
      </div>
    </>
  );
}
