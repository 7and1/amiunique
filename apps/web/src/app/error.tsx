'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20">
      <div className="max-w-md w-full mx-auto px-4 text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-red-500 to-orange-500">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Error text */}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          An unexpected error occurred while processing your request.
          Our fingerprint analysis hit a snag.
        </p>

        {/* Error details (development only) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-left dark:border-red-800 dark:bg-red-950">
            <p className="text-xs font-mono text-red-700 dark:text-red-300 break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Error ID for support */}
        {error.digest && (
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
            Error ID: <code className="font-mono">{error.digest}</code>
          </p>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            <Home className="h-4 w-4" />
            Go home
          </Link>
        </div>

        {/* Help section */}
        <div className="mt-12 rounded-2xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
            <Bug className="h-4 w-4" />
            Need help?
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            If this error persists, try clearing your browser cache or using a different browser.
            You can also{' '}
            <a
              href="https://github.com/anthropics/amiunique/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline dark:text-indigo-400"
            >
              report this issue
            </a>
            {' '}with the error ID above.
          </p>
        </div>
      </div>
    </div>
  );
}
