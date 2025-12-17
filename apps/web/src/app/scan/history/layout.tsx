import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scan History | AmiUnique.io',
  description:
    'View your previous fingerprint scans. Track how your browser uniqueness changes over time with OS updates, VPN changes, or privacy add-ons.',
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
