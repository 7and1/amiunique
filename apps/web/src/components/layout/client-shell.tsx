'use client';

import type { ReactNode } from 'react';
import { ThemeWatcher } from './theme-watcher';
import { ScanFlowProvider } from '@/lib/scan-flow';
import { ErrorBoundary } from '@/components/error-boundary';

export function ClientShell({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ScanFlowProvider>
        <ThemeWatcher />
        {children}
      </ScanFlowProvider>
    </ErrorBoundary>
  );
}
