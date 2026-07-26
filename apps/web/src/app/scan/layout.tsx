import type { Metadata } from 'next';

// The scan experience now lives inline on the homepage; this route is kept as
// a redirect shell for old links. public/_redirects serves a real 301 on
// Cloudflare Pages before this page is ever reached.
export const metadata: Metadata = {
  title: 'Scan Your Browser Fingerprint',
  robots: { index: false, follow: false },
  alternates: { canonical: '/' },
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
