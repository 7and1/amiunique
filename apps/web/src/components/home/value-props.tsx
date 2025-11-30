import { Eye, ShieldCheck, LineChart, Cpu } from 'lucide-react';

const props = [
  {
    icon: LineChart,
    title: 'Bell curve telemetry',
    body: 'Realtime percentile mapping shows whether you are a statistical outlier or hidden inside the crowd.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparent data contract',
    body: 'Every collector is documented with lock associations so auditors know exactly what is stored in D1.',
  },
  {
    icon: Cpu,
    title: '80+ deterministic collectors',
    body: 'WebGL, Canvas, AudioContext, codecs, permissions and TLS fingerprints combine into the Three-Lock system.',
  },
  {
    icon: Eye,
    title: 'Lie detection & spoof alerts',
    body: 'We cross-check timezone, locale, UA, and network metadata to spot automation or deliberate spoofing.',
  },
];

export function ValueProps() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {props.map(prop => (
        <article
          key={prop.title}
          className="rounded-3xl border border-white/30 bg-gradient-to-br from-white/80 via-white/60 to-white/30 p-6 shadow-card backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-2xl dark:border-white/5 dark:from-white/10 dark:via-white/5 dark:to-transparent"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/30 text-indigo-500">
            <prop.icon className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-xl font-semibold">{prop.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{prop.body}</p>
        </article>
      ))}
    </div>
  );
}
