'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RedirectNoticeProps {
  to: string;
  label?: string;
  delayMs?: number;
}

// Lightweight client-only redirect with a tiny fallback message for static export
export function RedirectNotice({ to, label = 'destination', delayMs = 50 }: RedirectNoticeProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace(to), delayMs);
    return () => clearTimeout(timer);
  }, [router, to, delayMs]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-center p-6">
      <div>
        <p className="text-sm text-muted-foreground">Redirecting to {label}…</p>
        <p className="text-xl font-semibold mt-2">AmiUnique.io</p>
      </div>
    </div>
  );
}
