/**
 * Global loading skeleton for the app
 */
export default function Loading() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-200 dark:border-slate-700" />
          <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-t-primary-500 animate-spin" />
        </div>
        <div className="text-sm text-muted-foreground animate-pulse">Loading...</div>
      </div>
    </div>
  );
}
