import { LogoMark } from "@/ui/brand/Logo";
import { cn } from "@/lib/cn";

/**
 * Full-viewport branded loader for route-level Suspense boundaries
 * (app/loading.tsx, (app)/loading.tsx). Two animations only, both cheap:
 *   1. the shackle "clasps" shut once on mount (entrance, not a loop)
 *   2. a thin ring rotates around the mark (the actual loading affordance)
 * No blur, no particles, no continuous floating — CSS transform/opacity only.
 */
export function LoadingScreen({
  label,
  fullViewport = true,
}: {
  /** Omit for frequent in-app transitions — the spinner alone is enough once you've seen it a few times. */
  label?: string;
  /** false when nested inside a persistent shell (e.g. the app sidebar) — sizes to its container instead of the viewport. */
  fullViewport?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 bg-bg",
        fullViewport ? "min-h-screen" : "py-24",
      )}
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-accent-soft border-t-accent"
          style={{ animation: "lk-ring 900ms linear infinite" }}
        />
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent"
          style={{ animation: "lk-shackle 520ms var(--ease) both" }}
        >
          <LogoMark size={22} tone="mono" className="text-accent-fg" />
        </span>
      </div>
      {label && <p className="text-sm text-subtle">{label}</p>}
    </div>
  );
}
