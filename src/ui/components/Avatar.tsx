"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Deterministic avatar: image if present, otherwise initials on a tinted
 * chip. "Profile picture URL" is free-text with no validation that it
 * resolves to a real image — a broken/dead URL renders the browser's
 * default broken-image box with overflowing alt text instead of being
 * contained by the avatar's size, so this falls back to initials on error
 * rather than ever showing that.
 */
export function Avatar({
  name,
  image,
  size = 36,
  className,
}: {
  name?: string | null;
  image?: string | null;
  size?: number;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const initials = (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // The native `error` event doesn't bubble, and a server-rendered <img>
  // can finish failing before hydration attaches the onError listener —
  // that miss would otherwise leave the broken-image box on screen
  // permanently. This catches that already-failed state once mounted.
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth === 0) {
      setErrored(true);
    }
  }, [image]);

  if (image && !errored) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        ref={imgRef}
        src={image}
        alt={name ?? ""}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover", className)}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.4) }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent",
        className,
      )}
    >
      {initials}
    </div>
  );
}
