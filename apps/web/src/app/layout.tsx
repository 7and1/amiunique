import type { Metadata, Viewport } from 'next';
import { Mail, Github } from 'lucide-react';
import '@/styles/globals.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ClientShell } from '@/components/layout/client-shell';
import { Toaster } from '@/components/ui/toast';
import { HeaderNav } from '@/components/layout/header-nav';
import Link from 'next/link';
import {
  OrganizationJsonLd,
  WebApplicationJsonLd,
  FAQJsonLd,
  defaultFAQs,
} from '@/components/seo/json-ld';
import { SkipToContent } from '@/components/a11y';
import { FingerprintAssistant } from '@/components/ai';

const fontSans = GeistSans;
const fontMono = GeistMono;

const themeInitScript = `(() => {
  try {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
  } catch (_) {}
})();`;

export const metadata: Metadata = {
  metadataBase: new URL('https://amiunique.io'),
  title: {
    default: 'AmiUnique.io - Browser Fingerprinting Detection | Test Your Digital Identity',
    template: '%s | AmiUnique.io',
  },
  description:
    'Discover how unique your browser fingerprint is with 80+ detection dimensions. Free browser fingerprint test that shows how websites track you. Canvas, WebGL, audio fingerprinting analysis.',
  keywords: [
    'browser fingerprinting',
    'browser fingerprint test',
    'digital fingerprint',
    'canvas fingerprint',
    'webgl fingerprint',
    'audio fingerprint',
    'online privacy',
    'browser tracking',
    'device fingerprint',
    'fingerprint detection',
    'privacy test',
    'am i unique',
    'browser uniqueness',
    'tracking protection',
  ],
  authors: [{ name: 'AmiUnique.io Team' }],
  creator: 'AmiUnique.io',
  publisher: 'AmiUnique.io',
  category: 'Technology',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://amiunique.io',
    siteName: 'AmiUnique.io',
    title: 'AmiUnique.io - Are You Unique? Browser Fingerprint Test',
    description:
      'Free browser fingerprinting detection tool. Analyze 80+ dimensions of your digital fingerprint and see how websites can track you.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AmiUnique.io - Browser Fingerprinting Detection Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@amiunique_io',
    creator: '@amiunique_io',
    title: 'AmiUnique.io - Are You Unique?',
    description: 'Discover how unique your browser fingerprint is with 80+ detection dimensions. Free privacy test.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://amiunique.io',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontSans.variable} ${fontMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preconnect" href="https://api.amiunique.io" />
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
          suppressHydrationWarning
        />
        <OrganizationJsonLd />
        <WebApplicationJsonLd />
        <FAQJsonLd questions={defaultFAQs} />
      </head>
      <body className="bg-background text-foreground antialiased">
        <SkipToContent />
        <ClientShell>
          <div className="relative flex min-h-screen flex-col">
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-80">
              <div className="absolute inset-x-0 top-0 h-[300px] bg-gradient-to-b from-indigo-200/50 via-transparent to-transparent dark:from-indigo-900/20" />
            </div>
          <HeaderNav />
          <main id="main-content" className="flex-1" tabIndex={-1}>{children}</main>
            <footer className="border-t border-white/20 bg-white/80 py-10 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/70">
              <div className="container mx-auto px-4">
                <div className="flex flex-col items-start justify-between gap-6 text-sm text-muted-foreground md:flex-row md:items-center">
                  <div>
                    <p className="font-semibold text-foreground">AmiUnique.io</p>
                    <p>Browser fingerprint analytics • 80+ collectors • Privacy-first</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <Link href="/legal/privacy" className="transition-colors hover:text-foreground">
                      Privacy Policy
                    </Link>
                    <Link href="/legal/terms" className="transition-colors hover:text-foreground">
                      Terms of Service
                    </Link>
                    <Link href="/developers" className="transition-colors hover:text-foreground">
                      API Docs
                    </Link>
                    <Link href="/legal/opt-out" className="transition-colors hover:text-foreground">
                      Delete My Data
                    </Link>
                  </div>
                </div>
                {/* Contact & Social */}
                <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-t border-white/10 pt-6">
                  <div className="flex items-center gap-6">
                    <a
                      href="mailto:privacy@amiunique.io"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Mail className="h-4 w-4" />
                      privacy@amiunique.io
                    </a>
                    <a
                      href="https://github.com/7and1/amiunique/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Made for privacy researchers. Open source and transparent.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </ClientShell>
          <FingerprintAssistant />
          <Toaster />
      </body>
    </html>
  );
}
