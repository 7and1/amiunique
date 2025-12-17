/**
 * Loading skeleton for stats page
 */
export default function StatsLoading() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Header skeleton */}
        <div className="text-center mb-12">
          <div className="h-10 w-64 mx-auto bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-4" />
          <div className="h-4 w-96 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
              <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Distribution charts skeleton */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-6" />
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex items-center gap-4">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                    <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Trend chart skeleton */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-6" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
