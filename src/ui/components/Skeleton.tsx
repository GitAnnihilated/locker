import { cn } from "@/lib/cn";

/**
 * Base skeleton block — a shimmer sweep, not a pulse. Pulse reads as
 * "something is wrong"; a directional shimmer reads as "content is arriving."
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-muted", className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
    </div>
  );
}

/** Pre-composed skeleton for a Card-shaped block (list items, dashboard tiles). */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface p-5", className)}>
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

/** A vertical stack of row skeletons — for lists inside a Card body. */
export function RowSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
          <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
