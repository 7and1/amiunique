import { BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { DistributionContent } from './distribution-content';

export const metadata = {
  title: 'Browser Distribution Analytics | Global Fingerprint Demographics',
  description: 'See browser, operating system, device type, and geographic distribution of browser fingerprints. Chrome vs Firefox vs Safari market share from fingerprint data.',
};

const breadcrumbs = [
  { name: 'Home', url: 'https://amiunique.io' },
  { name: 'Stats', url: 'https://amiunique.io/stats' },
  { name: 'Global Distribution', url: 'https://amiunique.io/stats/global-distribution' },
];

export default function GlobalDistributionPage() {
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <DistributionContent />
    </>
  );
}
