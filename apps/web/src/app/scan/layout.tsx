import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scan Your Browser Fingerprint | AmiUnique.io',
  description:
    'Free browser fingerprint test - analyze 80+ dimensions to see how unique and trackable your browser is. Real-time scanning with Three-Lock hash system.',
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
