import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Fingerprint, LockKeyhole, Network, ShieldCheck } from 'lucide-react';
import { IPReport } from '@/components/ip/ip-report';
import { BreadcrumbJsonLd, FAQJsonLd, WebApplicationJsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'What Does My IP Reveal? Network Privacy Check',
  description:
    'See the public IP address, network operator, approximate location, proxy signals, and reputation websites can observe from your current connection.',
  alternates: {
    canonical: '/ip',
  },
  openGraph: {
    title: 'What Does My IP Reveal? Network Privacy Check',
    description:
      'Inspect the network identity websites can observe from your current connection—without entering or searching for another IP.',
    url: '/ip',
    type: 'website',
  },
};

const observableFacts = [
  {
    Icon: Network,
    term: 'Network operator',
    description:
      'Your autonomous system number (ASN) usually identifies the ISP, mobile carrier, workplace network, or hosting provider carrying the connection.',
  },
  {
    Icon: ShieldCheck,
    term: 'Network reputation',
    description:
      'Reputation services may classify proxy, datacenter, or abuse signals. A low-risk label does not mean the connection is anonymous.',
  },
  {
    Icon: LockKeyhole,
    term: 'Approximate location',
    description:
      'IP geolocation normally points to a broad city or region, not a precise street address. VPNs can change the location that websites infer.',
  },
  {
    Icon: Fingerprint,
    term: 'Connection versus fingerprint',
    description:
      'Changing an IP can hide one network layer while browser characteristics remain linkable. A full scan checks both layers together.',
  },
];

const ipFaqs = [
  {
    question: 'Can a website see my exact home address from my IP?',
    answer:
      'No. IP geolocation resolves to a broad city or region at best, and is often off by tens of kilometres — mobile carriers and VPNs shift it further. What an IP reliably reveals is the network operator (ISP, carrier, company, or datacenter), not a street address.',
  },
  {
    question: 'Does AmiUnique store my IP address?',
    answer:
      'No. Your raw IP address is never stored — not even in hashed form. The report on this page is generated for your current connection only, and the database keeps just derived summaries such as a network risk band.',
  },
  {
    question: 'Can I look up someone else’s IP address here?',
    answer:
      'No. There is deliberately no IP search box. This page only reports on the connection you are visiting from, which keeps the tool useful for self-audits without enabling lookups of other people.',
  },
  {
    question: 'Does a VPN make me anonymous?',
    answer:
      'A VPN changes the IP and network operator that websites observe, but your browser fingerprint — canvas, fonts, hardware and WebRTC signals — stays linkable across connections. Run the full scan to check both layers together.',
  },
];

export default function IPPage() {
  return (
    <div className="py-10 sm:py-14">
      <WebApplicationJsonLd
        name="AmiUnique Current IP Privacy Check"
        url="https://amiunique.io/ip"
        description="A self-only connection privacy report showing the current public IP, network operator, approximate location, and reputation signals."
        featureList={[
          'Current public IP check',
          'Network operator identification',
          'Approximate IP location',
          'Proxy and datacenter reputation signals',
          'Masked-by-default address display',
        ]}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://amiunique.io' },
          { name: 'My IP', url: 'https://amiunique.io/ip' },
        ]}
      />
      <FAQJsonLd questions={ipFaqs} />

      <div className="container mx-auto max-w-5xl px-4">
        <header className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
            Network privacy check
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            What does my IP reveal?
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            This report inspects only the connection you are using right now. There is no IP search
            box and no way to query someone else&apos;s address.
          </p>
        </header>

        <div className="mt-8">
          <IPReport />
        </div>

        <section className="mt-14" aria-labelledby="observable-heading">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Read the layers
            </p>
            <h2 id="observable-heading" className="mt-2 text-2xl font-semibold sm:text-3xl">
              What websites can infer from a connection
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              An IP address is one signal, not a complete identity. These fields explain what the
              network layer contributes to tracking and privacy decisions.
            </p>
          </div>

          <dl className="mt-7 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {observableFacts.map(({ Icon, term, description }) => (
              <div
                key={term}
                className="grid gap-3 py-6 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-8"
              >
                <dt className="flex items-center gap-3 font-semibold">
                  <span className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {term}
                </dt>
                <dd className="text-sm leading-6 text-muted-foreground sm:text-base">
                  {description}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-14" aria-labelledby="ip-faq-heading">
          <h2 id="ip-faq-heading" className="text-2xl font-semibold sm:text-3xl">
            IP privacy questions
          </h2>
          <div className="mt-6 space-y-4">
            {ipFaqs.map(faq => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-white/5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left font-medium [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDown
                    className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </summary>
                <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold">Check the browser layer too</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The fingerprint scan compares browser claims, WebRTC exposure, and this connection
                context without storing raw candidate IP addresses.
              </p>
            </div>
            <Link
              href="/?scan=1#scan"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Run full privacy scan
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
