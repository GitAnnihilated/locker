import { cn } from "@/lib/cn";

/**
 * LOCKER LOGO
 * ------------------------------------------------------------------
 * An original mark: a friendly, rounded locker-door body with a
 * confident shackle (reliability) and an orange keyhole (the warm
 * focal point). Deliberately NOT a cybersecurity padlock — the soft
 * superellipse body reads as a school locker, and the rounded shackle
 * keeps it approachable. Two-tone by design so it stays crisp at 16px
 * and timeless; lime + orange carry the energy elsewhere in the UI.
 *
 * tone="brand"  -> pine body + orange keyhole (default)
 * tone="mono"   -> fully currentColor, including the keyhole — for small
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
  const body = tone === "mono" ? "currentColor" : "hsl(var(--accent))";
  const keyhole = tone === "mono" ? "currentColor" : "hsl(var(--brand-orange))";

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
      {/* shackle */}
      <path
        d="M13.5 20 V15 a6.5 6.5 0 0 1 13 0 V20"
        stroke={body}
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* locker-door body */}
      <rect x="9" y="18.5" width="22" height="16" rx="6" fill={body} />
      {/* keyhole */}
      <circle cx="20" cy="25" r="2.5" fill={keyhole} />
      <path d="M18.5 26.2 L20 30.6 L21.5 26.2 Z" fill={keyhole} />
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
