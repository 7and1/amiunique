import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'Scan Your Browser Fingerprint | AmiUnique.io',
  description:
    'Free browser fingerprint test - analyze 80+ dimensions to see how unique and trackable your browser is. Real-time scanning with Three-Lock hash system.',
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://amiunique.io' },
          { name: 'Scan', url: 'https://amiunique.io/scan' },
        ]}
      />
      {children}
    </>
  );
}
