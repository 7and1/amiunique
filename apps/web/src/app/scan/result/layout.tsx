import type { Metadata } from 'next';

// Results now render inline on the homepage; this route is a redirect shell
// for old links (public/_redirects serves the real 301 on Cloudflare Pages).
export const metadata: Metadata = {
  title: 'Your Fingerprint Results',
  robots: { index: false, follow: false },
  alternates: { canonical: '/' },
};

export default function ResultLayout({ children }: { children: React.ReactNode }) {
  return children;
}
