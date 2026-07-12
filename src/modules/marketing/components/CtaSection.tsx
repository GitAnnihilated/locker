import Link from "next/link";
import { Button } from "@/ui/components/Button";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="relative overflow-hidden rounded-xl bg-accent px-8 py-16 text-center sm:px-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_100%,hsl(var(--brand-lime)/0.25)_0%,transparent_70%)]"
        />
        <div className="relative">
          <h2 className="text-3xl font-bold text-balance text-accent-fg sm:text-4xl">
            Your class is one invite code away.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-accent-fg/80">
            No setup fee, no school approval, no waiting for someone else to go first.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button
                size="lg"
                className="!bg-surface !text-accent shadow-lg hover:!bg-muted"
              >
                Get started free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
