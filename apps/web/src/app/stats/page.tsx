import { StatsDatasetJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { StatsContent } from './stats-content';

export const metadata = {
  title: 'Browser Fingerprint Statistics | Global Distribution Analytics',
  description: 'Real-time browser fingerprint statistics from millions of analyzed visitors. See global browser, OS, device, and geographic distribution data.',
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
