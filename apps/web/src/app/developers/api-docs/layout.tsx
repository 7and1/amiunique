import type { Metadata } from 'next';

// Redirect shell for old /developers/api-docs links; public/_redirects serves
// the real 301 on Cloudflare Pages before this page is ever reached.
export const metadata: Metadata = {
  title: 'API Documentation',
  robots: { index: false, follow: false },
  alternates: { canonical: '/developers' },
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
