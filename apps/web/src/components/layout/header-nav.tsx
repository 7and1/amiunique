'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ApiStatusPill } from '@/components/ui/api-status-pill';
import { useApiHealth } from '@/hooks/use-api-health';

export function HeaderNav() {
  const {
    data: apiHealth,
    loading: apiHealthLoading,
    refresh: refreshHealth,
    error: apiHealthError,
  } = useApiHealth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:border-white/5 dark:bg-slate-950/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 text-sm font-semibold tracking-tight"
          aria-label="AmiUnique.io home"
        >
          <Image src="/favicon.svg" alt="AmiUnique.io" width={40} height={40} priority />
          <div className="hidden flex-col sm:flex">
            <span className="text-base font-semibold">AmiUnique.io</span>
            <span className="text-xs text-muted-foreground">Quantify your browser identity</span>
          </div>
        </Link>
        <nav
          className="flex min-w-0 items-center gap-3 text-sm font-medium sm:gap-6"
          aria-label="Primary"
        >
          {[
            { label: 'Scan', href: '/scan', mobile: true },
            { label: 'My IP', href: '/ip', mobile: true },
            { label: 'Statistics', href: '/stats', mobile: false },
            { label: 'Developers', href: '/developers', mobile: false },
            { label: 'Privacy', href: '/legal/privacy', mobile: false },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={
                link.mobile
                  ? 'text-muted-foreground transition-colors hover:text-foreground'
                  : 'hidden text-muted-foreground transition-colors hover:text-foreground md:block'
              }
            >
              {link.label}
            </Link>
          ))}
          <ApiStatusPill
            health={apiHealth}
            loading={apiHealthLoading}
            error={apiHealthError}
            onRetry={refreshHealth}
          />
        </nav>
      </div>
    </header>
  );
}
