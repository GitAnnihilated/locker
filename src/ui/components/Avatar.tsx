import { cn } from "@/lib/cn";

/** Deterministic avatar: image if present, otherwise initials on a tinted chip. */
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
  const initials = (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={image}
        alt={name ?? ""}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover", className)}
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
