import Link from "next/link";
import { Button } from "@/ui/components/Button";
import { ProductPreviewCard } from "./ProductPreviewCard";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* one static radial tint, not a loop — cheap and fixed at paint time */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[560px] bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--accent-soft))_0%,transparent_70%)]"
      />

      <div className="mx-auto grid max-w-6xl gap-14 px-6 pb-20 pt-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pb-28 lg:pt-24">
        <div>
          <p className="animate-fade-up text-2xs font-semibold uppercase tracking-[0.16em] text-accent">
            Built for students, not school IT departments
          </p>
          <h1 className="animate-fade-up reveal-1 mt-4 text-display-sm font-bold text-balance sm:text-display">
            Everything your class needs.{" "}
            <span className="text-accent">Nothing it doesn&apos;t.</span>
          </h1>
          <p className="animate-fade-up reveal-2 mt-5 max-w-lg text-lg text-subtle text-pretty">
            Homework, marketplace, project groups, and real achievements —
            one fast, free tool students actually want to open every day.
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
            No school sign-off required. Your class is ready in under a minute.
          </p>
        </div>

        <div className="animate-scale-in reveal-2 relative mx-auto w-full max-w-sm lg:max-w-none">
          <ProductPreviewCard className="shadow-lg" />
        </div>
      </div>
    </section>
  );
}
