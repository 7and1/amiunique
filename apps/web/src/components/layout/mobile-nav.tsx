'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X, Fingerprint } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

const LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Scan', href: '/#scan' },
  { label: 'My IP', href: '/ip' },
  { label: 'Statistics', href: '/stats' },
  { label: 'Developers', href: '/developers' },
  { label: 'Privacy Policy', href: '/legal/privacy' },
  { label: 'Delete My Data', href: '/legal/opt-out' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open navigation menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/50 text-muted-foreground transition-colors hover:text-foreground dark:border-white/10 dark:bg-white/5 md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col border-l border-white/10 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:bg-slate-950/95"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2 text-sm font-semibold">
              <Fingerprint className="h-4 w-4 text-primary-500" />
              AmiUnique.io
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close navigation menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <nav aria-label="Mobile" className="mt-6 flex flex-col gap-1">
            {LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
