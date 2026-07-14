import Link from "next/link";
import { Button } from "@/ui/components/Button";
import { ProductPreviewCard } from "./ProductPreviewCard";

// Icon + label only — deliberately just 4, not all 6 modules. This strip
// exists to be scanned in a second, not read. Anyone wanting the full
// picture reads the Features section below; this just proves at a glance
// that Locker isn't a single-purpose tool.
const PILLARS = [
  { icon: "📚", label: "Homework", tint: "bg-accent-soft text-accent" },
  { icon: "👥", label: "Groups", tint: "bg-brand-lime-soft text-brand-lime" },
  { icon: "📝", label: "Notes", tint: "bg-brand-orange-soft text-brand-orange" },
  { icon: "🏆", label: "Achievements", tint: "bg-accent-soft text-accent" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* one static radial tint, not a loop — cheap and fixed at paint time */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[560px] bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--accent-soft))_0%,transparent_70%)]"
      />

      <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pb-28 lg:pt-24">
        <div>
          {/* Unambiguous even in all-caps — "administrators" can't be misread
              as a pronoun the way "IT" could. */}
          <p className="animate-fade-up text-2xs font-semibold uppercase tracking-[0.16em] text-accent">
            Built for students — not administrators
          </p>
          <h1 className="animate-fade-up reveal-1 mt-4 text-display-sm font-bold text-balance sm:text-display">
            The one app for your class —{" "}
            <span className="text-accent">homework, groups, and achievements.</span>
          </h1>
          <p className="animate-fade-up reveal-2 mt-5 max-w-lg text-lg text-subtle text-pretty">
            Share notes, stay organized, and get real credit for what you do —
            free, and your class is ready in under a minute.
          </p>

          <div className="animate-fade-up reveal-3 mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup">
              <Button size="lg">Get started free</Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="secondary">
                See how it works
              </Button>
            </Link>
          </div>

          <p className="animate-fade-up reveal-4 mt-5 text-sm text-faint">
            No school sign-off required.
          </p>

          {/* The "show, don't tell" strip: scannable in under a second, even
              by someone who reads nothing else on the page. */}
          <ul className="animate-fade-up reveal-4 mt-6 flex flex-wrap gap-2">
            {PILLARS.map((p) => (
              <li
                key={p.label}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${p.tint}`}
              >
                <span aria-hidden="true">{p.icon}</span>
                {p.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-scale-in reveal-2 relative mx-auto w-full max-w-sm lg:max-w-none">
          {/* A second, smaller real UI element peeking out behind the main
              preview — reinforces "this is more than one tool" visually,
              without fabricating a feature that doesn't exist. */}
          <div
            aria-hidden="true"
            className="absolute -right-3 -top-5 hidden rotate-3 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 shadow-md sm:flex"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-lime-soft text-sm">
              🏆
            </span>
            <div className="leading-tight">
              <p className="text-2xs font-semibold">Achievement added</p>
              <p className="text-2xs text-faint">Regional Science Fair</p>
            </div>
          </div>

          <ProductPreviewCard className="shadow-lg" />
        </div>
      </div>
    </section>
  );
}
