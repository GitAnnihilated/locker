import Link from "next/link";
import { MarketingHeader } from "./MarketingHeader";
import { Footer } from "./Footer";
import { Eyebrow } from "./Eyebrow";
import { BreadcrumbJsonLd } from "./BreadcrumbJsonLd";
import { Card, CardBody } from "@/ui/components/Card";
import { Button } from "@/ui/components/Button";

export interface FeatureLandingContent {
  path: string;
  icon: string;
  eyebrow: string;
  h1: string;
  intro: string;
  bullets: { title: string; description: string }[];
  sections: { heading: string; body: string }[];
  related: { href: string; label: string }[];
}

/**
 * Shared template for every public feature/landing page (/features/*,
 * /schools). One H1 per page, explanatory H2 sections, a bullet grid, and
 * a related-links block for internal linking — content comes from a data
 * object per page (see each route's page.tsx), the same "config data, not
 * code" pattern used for Badges/Perks/modules elsewhere in the app.
 */
export function FeatureLanding({ content }: { content: FeatureLandingContent }) {
  return (
    <main>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: content.h1, path: content.path }]} />
      <MarketingHeader />

      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[560px] bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--accent-soft))_0%,transparent_70%)]"
        />
        <div className="mx-auto max-w-3xl px-6 pb-16 pt-16 text-center sm:pb-20 sm:pt-24">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent-soft text-2xl">
            {content.icon}
          </span>
          <Eyebrow className="mt-5">{content.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-display-sm font-bold text-balance sm:text-display">{content.h1}</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-subtle text-pretty">{content.intro}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">Get started free</Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="secondary">
                See all features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 sm:pb-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.bullets.map((b) => (
            <Card key={b.title}>
              <CardBody>
                <h3 className="font-semibold">{b.title}</h3>
                <p className="mt-1.5 text-sm text-subtle">{b.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {content.sections.map((s) => (
        <section key={s.heading} className="border-t border-border bg-surface-2">
          <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
            <h2 className="text-3xl font-bold text-balance sm:text-4xl">{s.heading}</h2>
            <p className="mt-4 text-lg text-subtle text-pretty">{s.body}</p>
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <h2 className="text-xl font-semibold">More from Locker</h2>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {content.related.map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="text-sm font-medium text-accent hover:underline">
                {r.label} →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 sm:pb-20">
        <div className="relative overflow-hidden rounded-xl bg-accent px-8 py-14 text-center sm:px-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_100%,hsl(var(--brand-lime)/0.25)_0%,transparent_70%)]"
          />
          <div className="relative">
            <h2 className="text-3xl font-bold text-balance text-accent-fg sm:text-4xl">
              Try it with your class, free.
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/signup">
                <Button size="lg" className="!bg-surface !text-accent shadow-lg hover:!bg-muted">
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
