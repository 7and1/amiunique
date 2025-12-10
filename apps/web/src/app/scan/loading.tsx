/**
 * Loading skeleton for scan page
 */
export default function ScanLoading() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="text-center">
          {/* Icon skeleton */}
          <div className="mb-8 flex justify-center">
            <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>

          {/* Title skeleton */}
          <div className="h-8 w-48 mx-auto bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-4" />

          {/* Subtitle skeleton */}
          <div className="h-4 w-64 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-8" />

          {/* Mode badges skeleton */}
          <div className="flex justify-center gap-3 mb-6">
            <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
          </div>

          {/* Progress bar skeleton */}
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse mb-2" />
          <div className="flex justify-between">
            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
