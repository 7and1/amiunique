import { AlertTriangle, CheckCircle2, CircleHelp, Eye, Info, ShieldCheck } from 'lucide-react';
import type {
  AnalysisResult,
  ConsistencyCheck,
  ConsistencyCheckSeverity,
  ConsistencyCheckStatus,
  ConsistencyReport as ConsistencyReportData,
} from '@amiunique/core';
import { cn } from '@/lib/utils';

interface ConsistencyReportProps {
  report: ConsistencyReportData | undefined;
  lies: AnalysisResult['lies'];
}

interface DisplayCheck {
  code: string;
  title: string;
  message: string;
  status: ConsistencyCheckStatus;
  severity: ConsistencyCheckSeverity;
}

const legacyChecks: Array<{
  code: keyof AnalysisResult['lies'];
  title: string;
  message: string;
}> = [
  {
    code: 'os_mismatch',
    title: 'Operating system signals',
    message: 'The user agent and browser platform describe the same operating system.',
  },
  {
    code: 'browser_mismatch',
    title: 'Browser identity',
    message: 'Browser features are consistent with the reported browser family.',
  },
  {
    code: 'resolution_mismatch',
    title: 'Screen geometry',
    message: 'Screen and viewport measurements are internally consistent.',
  },
  {
    code: 'timezone_mismatch',
    title: 'Timezone internals',
    message: 'Timezone name and offset are internally consistent.',
  },
  {
    code: 'webgl_mismatch',
    title: 'Graphics identity',
    message: 'WebGL renderer signals are consistent with the platform.',
  },
  {
    code: 'headless',
    title: 'Headless browser signals',
    message: 'No headless-browser indicators were detected.',
  },
  {
    code: 'automation',
    title: 'Automation signals',
    message: 'No browser-automation indicators were detected.',
  },
];

const statusStyles: Record<
  ConsistencyCheckStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    iconClass: string;
    badgeClass: string;
    rowClass: string;
  }
> = {
  pass: {
    label: 'Passed',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    badgeClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    rowClass: 'border-slate-200/80 dark:border-slate-700',
  },
  flagged: {
    label: 'Flagged',
    icon: AlertTriangle,
    iconClass: 'text-amber-600 dark:text-amber-400',
    badgeClass:
      'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
    rowClass: 'border-amber-200/90 bg-amber-50/40 dark:border-amber-500/20 dark:bg-amber-500/5',
  },
  unavailable: {
    label: 'Unavailable',
    icon: CircleHelp,
    iconClass: 'text-slate-500 dark:text-slate-400',
    badgeClass:
      'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
    rowClass: 'border-slate-200/80 dark:border-slate-700',
  },
  indeterminate: {
    label: 'Inconclusive',
    icon: Info,
    iconClass: 'text-sky-600 dark:text-sky-400',
    badgeClass:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300',
    rowClass: 'border-sky-200/80 bg-sky-50/30 dark:border-sky-500/20 dark:bg-sky-500/5',
  },
};

const severityLabels: Record<ConsistencyCheckSeverity, string | null> = {
  none: null,
  advisory: 'Advisory',
  warning: 'Warning',
  critical: 'Critical',
};

function toLegacyDisplayChecks(lies: AnalysisResult['lies']): DisplayCheck[] {
  return legacyChecks.map(check => {
    const flagged = Boolean(lies[check.code]);
    return {
      code: check.code,
      title: check.title,
      message: flagged
        ? `${check.title} contain signals that do not agree. Review the detailed dimensions below.`
        : check.message,
      status: flagged ? 'flagged' : 'pass',
      severity: flagged ? 'warning' : 'none',
    };
  });
}

function CheckRow({ check }: { check: DisplayCheck | ConsistencyCheck }) {
  const style = statusStyles[check.status];
  const Icon = style.icon;
  const severityLabel = severityLabels[check.severity];

  return (
    <li className={cn('rounded-xl border p-4', style.rowClass)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', style.iconClass)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold">{check.title}</h4>
            <span
              className={cn(
                'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
                style.badgeClass
              )}
            >
              {severityLabel || style.label}
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{check.message}</p>
        </div>
      </div>
    </li>
  );
}

export function ConsistencyReport({ report, lies }: ConsistencyReportProps) {
  const browserChecks = toLegacyDisplayChecks(lies);
  const browserFlagged = browserChecks.filter(check => check.status === 'flagged').length;
  const networkFlagged = report ? report.contradiction_count + report.risk_signal_count : 0;
  const inconclusive =
    report?.checks.filter(
      check => check.status === 'unavailable' || check.status === 'indeterminate'
    ).length ?? 5;
  const totalFlagged = browserFlagged + networkFlagged;

  let verdict = 'Completed checks found no contradictions.';
  if (totalFlagged > 0) {
    verdict = `${totalFlagged} signal${totalFlagged === 1 ? '' : 's'} need attention.`;
  } else if (inconclusive > 0) {
    verdict = `No issues found in completed checks; ${inconclusive} could not be confirmed.`;
  }

  return (
    <section className="frosted-card" aria-labelledby="consistency-heading">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-slate-700">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Cross-layer checks
            </p>
            <h2 id="consistency-heading" className="mt-1 text-xl font-semibold">
              Privacy and consistency report
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{verdict}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-4 text-sm">
          <div>
            <span className="block font-mono text-xl font-semibold">
              {report?.contradiction_count ?? '—'}
            </span>
            <span className="text-xs text-muted-foreground">Contradictions</span>
          </div>
          <div>
            <span className="block font-mono text-xl font-semibold">
              {report?.risk_signal_count ?? '—'}
            </span>
            <span className="text-xs text-muted-foreground">Network signals</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Browser self-checks
          </h3>
          <ul className="mt-3 space-y-3">
            {browserChecks.map(check => (
              <CheckRow key={check.code} check={check} />
            ))}
          </ul>
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Browser × network checks
          </h3>
          {report ? (
            <ul className="mt-3 space-y-3">
              {report.checks.map(check => (
                <CheckRow key={check.code} check={check} />
              ))}
            </ul>
          ) : (
            <div className="mt-3 rounded-xl border border-slate-200 p-5 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">Network checks unavailable</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    This saved result predates cross-layer checks or the required network signals
                    were unavailable. It is not treated as a clean result.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
