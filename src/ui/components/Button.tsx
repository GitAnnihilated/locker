import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg shadow-xs hover:bg-accent-strong",
  secondary: "bg-muted text-text hover:bg-border",
  ghost: "bg-transparent text-text hover:bg-muted",
  danger: "bg-danger text-white shadow-xs hover:brightness-90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium",
        "transition duration-fast ease active:scale-[0.98]",
        "disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
