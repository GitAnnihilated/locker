import type { ReactNode } from "react";

/** Wraps a display name with an equipped NAME_COLOR perk's color, if any. */
export function CosmeticName({
  color,
  className,
  children,
}: {
  color?: string | null;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={className} style={color ? { color } : undefined}>
      {children}
    </span>
  );
}
