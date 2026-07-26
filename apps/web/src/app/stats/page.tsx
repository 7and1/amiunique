import { StatsDatasetJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { StatsContent } from './stats-content';

export const metadata = {
  title: 'Browser Fingerprint Statistics — Live Open Dataset',
  description:
    'Live browser fingerprint statistics from real scans: browser, OS, device, screen and country distributions from the AmiUnique.io open dataset.',
  alternates: { canonical: '/stats' },
};

export default function StatsPage() {
  return (
    <>
      <StatsDatasetJsonLd
        name="AmiUnique.io Browser Fingerprint Statistics"
        description="Aggregated browser fingerprint statistics (browsers, OS, devices, geography, screens) from the AmiUnique.io edge network."
        url="https://amiunique.io/stats"
        lastUpdated={new Date().toISOString()}
        total={2000000}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://amiunique.io' },
          { name: 'Statistics', url: 'https://amiunique.io/stats' },
        ]}
      />
      <StatsContent />
    </>
  );
}
