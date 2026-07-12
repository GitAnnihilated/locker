import { cn } from "@/lib/cn";

/** Small tracked label used above every section heading — the connective tissue of the page. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-2xs font-semibold uppercase tracking-[0.16em] text-accent", className)}>
      {children}
    </p>
  );
}
