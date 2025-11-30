'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';

/**
 * Toast provider component
 * Uses Sonner for beautiful, accessible toast notifications
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'group border-border bg-background text-foreground shadow-lg',
          title: 'text-foreground font-semibold',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800',
          error: 'bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800',
          warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
          info: 'bg-sky-50 border-sky-200 dark:bg-sky-950 dark:border-sky-800',
        },
      }}
      expand
      richColors
      closeButton
    />
  );
}

// Re-export toast for convenience
export { toast };
