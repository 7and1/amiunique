import { BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { FingerprintsContent } from './fingerprints-content';
import { statsSnapshotSeed } from '@/lib/stats-seed';

export const metadata = {
  title: 'Daily Fingerprint Trends | Browser Tracking Statistics',
  description:
    'Track daily browser fingerprint collection rates, unique device growth, and volatility patterns. 30-day statistics from our global edge network.',
  alternates: { canonical: '/stats/fingerprints' },
};

const breadcrumbs = [
  { name: 'Home', url: 'https://amiunique.io' },
  { name: 'Stats', url: 'https://amiunique.io/stats' },
  { name: 'Fingerprint Trends', url: 'https://amiunique.io/stats/fingerprints' },
];

export default function FingerprintsStatsPage() {
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <FingerprintsContent initial={statsSnapshotSeed} />
    </>
  );
}
