import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-200 dark:bg-slate-700',
        className
      )}
    />
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80',
        className
      )}
    >
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20 mt-2" />
    </div>
  );
}

export function SkeletonStatCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80',
        className
      )}
    >
      <div className="relative">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="mt-3 h-9 w-24" />
        <Skeleton className="mt-2 h-3 w-20" />
      </div>
    </div>
  );
}

export function SkeletonDistribution({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80',
        className
      )}
    >
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80',
        className
      )}
    >
      <Skeleton className="h-6 w-40 mb-4" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export function StatsPageSkeleton() {
  return (
    <div className="py-16">
      <div className="container mx-auto max-w-7xl px-4 space-y-16">
        {/* Hero Header Skeleton */}
        <header className="text-center space-y-6">
          <Skeleton className="h-8 w-48 mx-auto rounded-full" />
          <Skeleton className="h-14 w-[500px] mx-auto" />
          <Skeleton className="h-6 w-[400px] mx-auto" />
        </header>

        {/* Stats Grid Skeleton */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </section>

        {/* Distribution Preview Skeleton */}
        <section className="grid gap-8 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <SkeletonDistribution key={i} />
          ))}
        </section>

        {/* Deep Dive Cards Skeleton */}
        <section className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <SkeletonChart key={i} />
          ))}
        </section>
      </div>
    </div>
  );
}

export function FingerprintsPageSkeleton() {
  return (
    <div className="py-16">
      <div className="container mx-auto max-w-7xl px-4 space-y-12">
        <header className="text-center space-y-4">
          <Skeleton className="h-8 w-48 mx-auto rounded-full" />
          <Skeleton className="h-12 w-[400px] mx-auto" />
          <Skeleton className="h-5 w-[350px] mx-auto" />
        </header>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </section>

        <SkeletonChart className="h-96" />

        <div className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GlobalDistributionSkeleton() {
  return (
    <div className="py-16">
      <div className="container mx-auto max-w-7xl px-4 space-y-12">
        <header className="text-center space-y-4">
          <Skeleton className="h-8 w-48 mx-auto rounded-full" />
          <Skeleton className="h-12 w-[450px] mx-auto" />
          <Skeleton className="h-5 w-[380px] mx-auto" />
        </header>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <SkeletonChart key={i} />
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <SkeletonChart key={i} />
          ))}
        </section>
      </div>
    </div>
  );
}

export function HomePageStatsSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/30 bg-white/80 p-4 shadow-card dark:border-white/5 dark:bg-white/5"
          >
            <Skeleton className="h-3 w-28 mb-2" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
    </>
  );
}
