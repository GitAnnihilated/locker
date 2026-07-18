"use client";

import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Must render as a child of <Link> — useLinkStatus only reports the
 * pending state of its nearest ancestor Link. App Router wraps Link
 * navigation in a transition, so an already-mounted page shows zero visual
 * feedback on click until the new RSC payload arrives; this dims the link
 * instantly instead, so a click always reads as registered even before the
 * new page is ready.
 */
export function LinkPendingFade({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span className={cn("transition-opacity duration-fast", pending && "opacity-40", className)}>
      {children}
    </span>
  );
}
