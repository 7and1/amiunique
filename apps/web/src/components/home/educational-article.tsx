import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Fingerprint,
  Lock,
  MonitorSmartphone,
  Shield,
} from 'lucide-react';
import {
  lockTiers,
  mitigationTips,
  sources,
  trackingHarms,
  uniquenessStats,
} from '@/components/home/article-content';

/**
 * Long-form educational article for the homepage (#learn section).
 * Server-renderable — data arrays live in article-content.ts.
 */
export function EducationalArticle() {
  return (
    <section
      id="learn"
      className="scroll-mt-24 bg-gradient-to-b from-slate-50 to-white py-20 dark:from-slate-900 dark:to-slate-950"
    >
      <div className="container mx-auto max-w-4xl px-4">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h2 className="mb-8 flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            <Fingerprint className="h-10 w-10 text-indigo-500" />
            Am I Unique? Understanding Your Browser Identity
          </h2>

          {/* Section 1: Simple explanation */}
          <div className="mb-8 rounded-3xl border border-white/30 bg-white/80 p-8 shadow-lg dark:border-white/5 dark:bg-slate-800/50">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
              <Eye className="h-5 w-5 text-purple-500" />
              The Simple Truth About Digital Fingerprints
            </h3>
            <p className="mb-4 text-slate-600 dark:text-slate-300">
              Here&apos;s something that might surprise you: Every time you visit a website, your
              browser leaves behind a unique &quot;fingerprint&quot; - and no, we&apos;re not
              talking about cookies.
            </p>
            <p className="mb-4 text-slate-600 dark:text-slate-300">
              Think of it like this: Imagine walking into a room and someone could identify you just
              by the way you walk, the shoes you wear, the watch on your wrist, and the phone in
              your pocket. They don&apos;t need your name. They don&apos;t need your ID. They
              just...{' '}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                know it&apos;s you
              </span>
              .
            </p>
            <p className="mb-4 text-slate-600 dark:text-slate-300">
              That&apos;s browser fingerprinting. Websites can identify you by combining dozens of
              technical details about your browser and device - your screen resolution, installed
              fonts, graphics card, timezone, language settings, and about{' '}
              <span className="font-semibold">80+ other signals</span>.
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              The crazy part?{' '}
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                You can&apos;t delete it like a cookie
              </span>
              . It&apos;s not stored on your computer. It&apos;s calculated fresh every time you
              visit a site. And it works even in &quot;private&quot; or &quot;incognito&quot; mode.
            </p>
          </div>

          {/* Section 2: Statistics with data table */}
          <div className="mb-8 rounded-3xl border border-white/30 bg-white/80 p-8 shadow-lg dark:border-white/5 dark:bg-slate-800/50">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
              <MonitorSmartphone className="h-5 w-5 text-cyan-500" />
              Here&apos;s the Mind-Blowing Part (The Numbers Don&apos;t Lie)
            </h3>
            <p className="mb-6 text-slate-600 dark:text-slate-300">
              Researchers have analyzed millions of browser fingerprints at scale. The findings are
              clear - and honestly, a bit scary:
            </p>

            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                      Device Type
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                      Uniqueness Rate
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {uniquenessStats.map(row => {
                    const Icon = row.icon;
                    return (
                      <tr
                        key={row.deviceType}
                        className="border-b border-slate-100 last:border-b-0 dark:border-slate-800"
                      >
                        <td className="flex items-center gap-2 px-4 py-3">
                          <Icon className={`h-4 w-4 ${row.iconClass}`} /> {row.deviceType}
                        </td>
                        <td className={`px-4 py-3 font-mono font-semibold ${row.rateClass}`}>
                          {row.rate}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          <a
                            href={row.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-500 hover:underline"
                          >
                            {row.sourceLabel}
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/20 dark:bg-rose-500/10">
                <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                  Did you know?
                </p>
                <p className="text-sm text-rose-600 dark:text-rose-300">
                  Slido&apos;s research found that within just 24 hours, nearly{' '}
                  <span className="font-bold">10% of devices</span> change their fingerprint. But
                  the remaining 90%? They&apos;re trackable for weeks or months.
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  2024 Update
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-300">
                  Google announced they will <span className="font-bold">no longer prohibit</span>{' '}
                  their advertising customers from fingerprinting users. The UK ICO sharply
                  criticized this move.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Why it matters */}
          <div className="mb-8 rounded-3xl border border-white/30 bg-white/80 p-8 shadow-lg dark:border-white/5 dark:bg-slate-800/50">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Why Should You Care? (Real Talk)
            </h3>
            <p className="mb-4 text-slate-600 dark:text-slate-300">
              Here&apos;s the thing - most internet users say they&apos;re concerned about online
              tracking, yet far fewer understand how it actually works. That gap is a problem.
            </p>
            <p className="mb-4 text-slate-600 dark:text-slate-300">
              Browser fingerprinting enables:
            </p>
            <ul className="mb-4 space-y-3">
              {trackingHarms.map(harm => (
                <li
                  key={harm.title}
                  className="flex items-start gap-3 text-slate-600 dark:text-slate-300"
                >
                  <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${harm.dotClass}`} />
                  <span>
                    <span className="font-semibold">{harm.title}</span> - {harm.body}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-slate-600 dark:text-slate-300">
              The good news?{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Understanding is the first step to protection
              </span>
              . That&apos;s exactly why we built this tool.
            </p>
          </div>

          {/* Section 4: Three-Lock system */}
          <div className="mb-8 rounded-3xl border border-white/30 bg-white/80 p-8 shadow-lg dark:border-white/5 dark:bg-slate-800/50">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
              <Lock className="h-5 w-5 text-amber-500" />
              The Three-Lock System: How We Identify You
            </h3>
            <p className="mb-6 text-slate-600 dark:text-slate-300">
              We&apos;ve developed a &quot;Three-Lock&quot; classification system to help you
              understand fingerprinting stability:
            </p>
            <div className="space-y-4">
              {lockTiers.map(tier => (
                <div key={tier.name} className={tier.cardClass}>
                  <div className="mb-2 flex items-center gap-2">
                    <Lock className={`h-5 w-5 ${tier.iconClass}`} />
                    <span className={tier.titleClass}>{tier.name}</span>
                    <span className={tier.badgeClass}>{tier.stability}</span>
                  </div>
                  <p className={tier.bodyClass}>{tier.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: What you can do */}
          <div className="mb-8 rounded-3xl border border-white/30 bg-white/80 p-8 shadow-lg dark:border-white/5 dark:bg-slate-800/50">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
              <Shield className="h-5 w-5 text-emerald-500" />
              What Can You Actually Do About It?
            </h3>
            <p className="mb-6 text-slate-600 dark:text-slate-300">
              Look, I&apos;m not going to sugarcoat it - completely avoiding fingerprinting is
              nearly impossible. But here are practical steps that actually work:
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {mitigationTips.map(tip => (
                <div
                  key={tip.title}
                  className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-700/30"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {tip.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Bottom line + CTA */}
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-8 text-white shadow-2xl">
            <h3 className="mb-4 text-xl font-semibold">The Bottom Line</h3>
            <p className="mb-4 text-white/90">
              Browser fingerprinting isn&apos;t going away. In fact, as cookies become less reliable
              for tracking, fingerprinting is becoming{' '}
              <span className="font-semibold">more common, not less</span>.
            </p>
            <p className="mb-6 text-white/90">
              The question isn&apos;t whether you have a unique fingerprint - statistically, you
              probably do. The question is:{' '}
              <span className="font-semibold">do you know what it looks like?</span>
            </p>
            <p className="mb-6 text-white/90">
              We built AmiUnique.io to give you that visibility. No tracking, no data selling - just
              honest, transparent information about your digital identity. Because you deserve to
              know.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <a
                href="#scan"
                className="inline-flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-indigo-700 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <Fingerprint className="h-6 w-6" />
                Scan My Fingerprint Now
              </a>
              <span className="text-sm text-white/70">
                Free • No account required • Results in seconds
              </span>
            </div>
          </div>

          {/* Sources footer */}
          <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-700">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
              Sources &amp; Further Reading
            </p>
            <ul className="space-y-1 text-xs text-slate-400 dark:text-slate-500">
              {sources.map(source => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-indigo-500"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </section>
  );
}
