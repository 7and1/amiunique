import clsx from 'clsx';

interface Contribution {
  label: string;
  score: number; // percentage unique
  verdict: string;
}

const contributions: Contribution[] = [
  {
    label: 'Hardware',
    score: 86,
    verdict: 'Retina display + ProMotion + color gamut stand out',
  },
  {
    label: 'Software',
    score: 64,
    verdict: 'Font list + Intl overrides create a rare combo',
  },
  {
    label: 'Network',
    score: 32,
    verdict: 'Residential ASN blended with many similar peers',
  },
  {
    label: 'Behavior',
    score: 58,
    verdict: 'Timezone offset mismatch triggered lie detection',
  },
];

const severityColor = (score: number) => {
  // Unified cool palette: low scores = lighter/cooler, high scores = deeper purple
  if (score >= 75) return 'from-violet-500 via-purple-500 to-fuchsia-500';
  if (score >= 50) return 'from-indigo-500 via-violet-500 to-purple-500';
  if (score >= 25) return 'from-sky-400 via-indigo-400 to-violet-400';
  return 'from-cyan-400 via-sky-400 to-indigo-400';
};

export function ContributionPanel() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {contributions.map(contribution => (
        <section
          key={contribution.label}
          className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-card dark:border-white/5 dark:bg-white/5"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{contribution.label}</p>
          <div className="mt-6 flex items-end gap-3">
            <div className="w-full">
              <div className="relative h-36 w-full overflow-hidden rounded-2xl bg-slate-200/40 dark:bg-slate-800/40">
                <div
                  className={clsx(
                    'absolute bottom-0 left-0 right-0 rounded-2xl bg-gradient-to-t text-right text-2xl font-semibold text-white shadow-inner transition-all duration-700',
                    severityColor(contribution.score)
                  )}
                  style={{ height: `${contribution.score}%` }}
                >
                  <span className="absolute inset-0 flex items-end justify-center pb-3 font-mono text-3xl">
                    {contribution.score}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{contribution.verdict}</p>
        </section>
      ))}
    </div>
  );
}
