/**
 * Loading skeleton for scan result page
 */
export default function ResultLoading() {
  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header skeleton */}
        <div className="text-center mb-8">
          <div className="h-9 w-72 mx-auto bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-4" />
          <div className="h-4 w-48 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>

        {/* Main result card skeleton */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            {/* Icon skeleton */}
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>

            {/* Title & badge skeleton */}
            <div className="h-8 w-48 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
            <div className="h-6 w-32 mx-auto bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse mb-6" />

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <div className="h-8 w-16 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
                  <div className="h-3 w-20 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Three-Lock hashes skeleton */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="h-6 w-56 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
          <div className="grid md:grid-cols-3 gap-4">
            {['gold', 'silver', 'bronze'].map((lock) => (
              <div
                key={lock}
                className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <div className="flex justify-between mb-2">
                  <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
                <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
                <div className="h-8 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Dimension categories skeleton */}
        <div className="max-w-4xl mx-auto">
          <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
