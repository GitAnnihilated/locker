import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * LOCKER LOGO
 * ------------------------------------------------------------------
 * A rounded-square "workspace" with an L-shaped doorway cut through it —
 * the letterform L, a doorway breaching open to the container's edge
 * (never a sealed vault), and a keyhole silhouette, all in one shape.
 * A solid accent circle sits at the head of that channel as a connection
 * node — someone present in the shared space — rather than a literal lock
 * mechanism. Deliberately not a padlock/cybersecurity mark. Flat, two-tone,
 * legible from a 16px favicon up to a full navbar lockup.
 *
 * tone="brand"  -> brand ink body + accent node (default; --brand-ink
 *                  inverts light/dark automatically, see globals.css)
 * tone="mono"   -> fully currentColor, including the node — for small
 *                  on-color chips and watermarks where a second color
 *                  would need to match whatever it's sitting on
 */
export function LogoMark({
  size = 28,
  tone = "brand",
  className,
}: {
  size?: number;
  tone?: "brand" | "mono";
  className?: string;
}) {
  const maskId = useId();
  const body = tone === "mono" ? "currentColor" : "hsl(var(--brand-ink))";
  const node = tone === "mono" ? "currentColor" : "hsl(var(--brand-node))";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <mask id={maskId}>
        <rect x="4" y="4" width="32" height="32" rx="8" fill="#fff" />
        <rect x="15.2" y="10.4" width="5.6" height="14.4" rx="1.6" fill="#000" />
        <rect x="15.2" y="19.2" width="20.8" height="5.6" rx="1.2" fill="#000" />
        <circle cx="18" cy="10.4" r="4.4" fill="#000" />
      </mask>
      <rect x="4" y="4" width="32" height="32" rx="8" fill={body} mask={`url(#${maskId})`} />
      <circle cx="18" cy="10.4" r="3.6" fill={node} />
    </svg>
  );
}

/** Full lockup: mark + wordmark. Use in nav, footer, auth screens. */
export function Logo({
  size = 28,
  tone = "brand",
  showWord = true,
  className,
}: {
  size?: number;
  tone?: "brand" | "mono";
  showWord?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} tone={tone} />
      {showWord && (
        <span
          className="font-bold tracking-tight"
          style={{ fontSize: size * 0.66, color: tone === "mono" ? "currentColor" : "hsl(var(--text))" }}
        >
          Locker
        </span>
      )}
    </span>
  );
}
