import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Fingerprint Results | AmiUnique.io',
  description:
    'See how unique your browser fingerprint is. View your Three-Lock hashes, uniqueness ratio, and detailed breakdown of 80+ dimensions.',
};

export default function ResultLayout({ children }: { children: React.ReactNode }) {
  return children;
}
