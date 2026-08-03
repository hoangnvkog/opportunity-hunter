import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** Single shimmering block. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60",
        className,
      )}
      aria-hidden
    />
  );
}

/** Card-shaped skeleton with header + a few rows. */
export function SkeletonCard({ rows = 3, className }: SkeletonProps & { rows?: number }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-5 space-y-3",
        className,
      )}
      aria-hidden
    >
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}

/** Grid of metric card skeletons (use for the metrics-grid while loading). */
export function SkeletonMetricGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} rows={1} />
      ))}
    </div>
  );
}

/** Table row skeleton. */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="border-b bg-muted/30 p-3">
        <Skeleton className="h-3 w-1/4" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-3 p-3">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-3 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}