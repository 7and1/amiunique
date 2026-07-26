const TIP_CARDS = [
  {
    title: 'Rotate network & IP',
    body: 'Use a trusted VPN and rotate exit IPs; avoid reusing rare ASNs for sensitive browsing.',
  },
  {
    title: 'Normalize device signals',
    body: 'Match common screen resolutions (1920x1080), standard fonts, and disable custom theming when possible.',
  },
  {
    title: 'Limit high-entropy APIs',
    body: 'Disable WebGL/Canvas in hardened profiles, or use Tor/Firefox RFP to standardize outputs.',
  },
];

export function MitigationTips() {
  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <h3 className="text-lg font-semibold">How to reduce your tracking risk</h3>
        <div className="flex gap-2">
          <a
            href="https://support.mozilla.org/en-US/kb/resist-fingerprinting"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Browser Hardening Guide
          </a>
          <a
            href="https://www.eff.org/deeplinks/2019/12/deep-dive-browser-fingerprinting"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
          >
            EFF Deep Dive
          </a>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {TIP_CARDS.map(card => (
          <div
            key={card.title}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{card.title}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{card.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
