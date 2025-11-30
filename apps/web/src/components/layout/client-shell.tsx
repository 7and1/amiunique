'use client';

import type { ReactNode } from 'react';
import { ThemeWatcher } from './theme-watcher';
import { ScanFlowProvider } from '@/lib/scan-flow';

export function ClientShell({ children }: { children: ReactNode }) {
  return (
    <ScanFlowProvider>
      <ThemeWatcher />
      {children}
    </ScanFlowProvider>
  );
}
