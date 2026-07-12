"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";

/** Reusable overlay dialog — closes on backdrop click or Escape. */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* No blur — a plain darker scrim gives the same separation for free. */}
      <div className="absolute inset-0 animate-fade-in bg-text/45" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "animate-scale-in relative w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg",
          className,
        )}
      >
        {title && <h2 className="mb-4 text-lg font-bold">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
