import { cn } from "@/lib/cn";

export function ProgressBar({ pct, className }: { pct: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="h-full rounded-full bg-accent transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
