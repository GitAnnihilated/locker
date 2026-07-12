import type { Config } from "tailwindcss";

/**
 * Tokens live as CSS variables in globals.css; Tailwind maps semantic names
 * onto them so themes (light/dark, and future per-school accent overrides)
 * swap at runtime with zero rebuild.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "hsl(var(--bg) / <alpha-value>)",
        surface: "hsl(var(--surface) / <alpha-value>)",
        "surface-2": "hsl(var(--surface-2) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        "border-strong": "hsl(var(--border-strong) / <alpha-value>)",
        text: "hsl(var(--text) / <alpha-value>)",
        subtle: "hsl(var(--subtle) / <alpha-value>)",
        faint: "hsl(var(--faint) / <alpha-value>)",
        accent: "hsl(var(--accent) / <alpha-value>)",
        "accent-strong": "hsl(var(--accent-strong) / <alpha-value>)",
        "accent-soft": "hsl(var(--accent-soft) / <alpha-value>)",
        "accent-fg": "hsl(var(--accent-fg) / <alpha-value>)",
        "brand-lime": "hsl(var(--brand-lime) / <alpha-value>)",
        "brand-lime-soft": "hsl(var(--brand-lime-soft) / <alpha-value>)",
        "brand-orange": "hsl(var(--brand-orange) / <alpha-value>)",
        "brand-orange-soft": "hsl(var(--brand-orange-soft) / <alpha-value>)",
        success: "hsl(var(--success) / <alpha-value>)",
        "success-soft": "hsl(var(--success-soft) / <alpha-value>)",
        warning: "hsl(var(--warning) / <alpha-value>)",
        "warning-soft": "hsl(var(--warning-soft) / <alpha-value>)",
        danger: "hsl(var(--danger) / <alpha-value>)",
        "danger-soft": "hsl(var(--danger-soft) / <alpha-value>)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      fontSize: {
        // tightened, editorial scale
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.02em" }],
        "display-sm": ["2.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display": ["3.5rem", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
        "display-lg": ["4.75rem", { lineHeight: "0.98", letterSpacing: "-0.035em" }],
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        soft: "var(--shadow-sm)", // back-compat alias for existing components
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      transitionTimingFunction: {
        DEFAULT: "var(--ease)",
        ease: "var(--ease)",
      },
      transitionDuration: {
        DEFAULT: "var(--dur)",
        fast: "var(--dur-fast)",
        slow: "var(--dur-slow)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.4s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
