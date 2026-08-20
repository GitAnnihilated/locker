import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { MarketingHeader } from "@/modules/marketing/components/MarketingHeader";
import { Footer } from "@/modules/marketing/components/Footer";
import { Eyebrow } from "@/modules/marketing/components/Eyebrow";
import { BreadcrumbJsonLd } from "@/modules/marketing/components/BreadcrumbJsonLd";
import { Card, CardBody } from "@/ui/components/Card";
import { Button } from "@/ui/components/Button";

export const metadata: Metadata = buildMetadata({
  title: "Locker for Schools",
  description:
    "Locker is a school student portal that complements your ERP — homework, groups, a marketplace, achievements, and parent-teacher meetings, piloted one class at a time.",
  path: "/schools",
});

const ROLE_POINTS = [
  {
    role: "Principal / IT Admin",
    icon: "🏫",
    description: "Set up the school once, generate a staff code for teachers, and let classes form on their own — no bulk roster import required to start.",
  },
  {
    role: "Teachers",
    icon: "🧑‍🏫",
    description: "Create or join classes, post homework, open parent-teacher meeting slots, and keep a running notebook on each student.",
  },
  {
    role: "Students",
    icon: "🎓",
    description: "Join a class with an invite code, then use the same account for homework, groups, the marketplace, and a real achievements portfolio.",
  },
];

const WHY_POINTS = [
  {
    title: "A complement, not a replacement",
    description: "Your existing ERP stays the system of record for attendance, fees, and official notices. Locker is the day-to-day collaboration layer on top of it.",
  },
  {
    title: "Contained to your school",
    description: "Homework boards and the marketplace stay scoped to your own school — nothing leaks across institutions.",
  },
  {
    title: "Real roles, not a free-for-all",
    description: "A Principal/IT Admin sets up the school; teachers own their classes; students join, never create one in a teacher's name.",
  },
  {
    title: "Piloted one class at a time",
    description: "No requirement to roll it out school-wide before it's proven itself with a single class or grade.",
  },
];

export default function SchoolsPage() {
  return (
    <main>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, { name: "Schools", path: "/schools" }]} />
      <MarketingHeader />

      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[560px] bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--accent-soft))_0%,transparent_70%)]"
        />
        <div className="mx-auto max-w-3xl px-6 pb-16 pt-16 text-center sm:pb-20 sm:pt-24">
          <Eyebrow>For schools</Eyebrow>
          <h1 className="mt-4 text-display-sm font-bold text-balance sm:text-display">
            A school student portal your students will actually open
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-subtle text-pretty">
            Locker gives every class its own homework board, group finder, marketplace, and
            achievement record — built for students first, so adoption doesn&apos;t depend on
            a mandate from the top.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">Start a pilot class</Button>
            </Link>
            <Link href="/guide">
              <Button size="lg" variant="secondary">
                Read the teacher guide
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 sm:pb-20">
        <div className="max-w-xl">
          <Eyebrow>Built for every role in a school</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold text-balance sm:text-4xl">
            One platform, three genuinely different views.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {ROLE_POINTS.map((r) => (
            <Card key={r.role}>
              <CardBody>
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft text-xl">
                  {r.icon}
                </span>
                <h3 className="mt-4 font-semibold">{r.role}</h3>
                <p className="mt-1.5 text-sm text-subtle">{r.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface-2">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="max-w-xl">
            <Eyebrow>Why schools choose Locker</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold text-balance sm:text-4xl">
              Built to earn a pilot, not demand one.
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {WHY_POINTS.map((p) => (
              <div key={p.title} className="rounded-lg border border-border bg-surface p-5">
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-sm text-subtle">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <h2 className="text-xl font-semibold">Explore what students use day to day</h2>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <Link href="/features/homework" className="text-sm font-medium text-accent hover:underline">
              Homework tracker →
            </Link>
          </li>
          <li>
            <Link href="/features/groups" className="text-sm font-medium text-accent hover:underline">
              Group Finder →
            </Link>
          </li>
          <li>
            <Link href="/features/marketplace" className="text-sm font-medium text-accent hover:underline">
              Student marketplace →
            </Link>
          </li>
          <li>
            <Link href="/features/achievements" className="text-sm font-medium text-accent hover:underline">
              Achievements portfolio →
            </Link>
          </li>
          <li>
            <Link href="/guide" className="text-sm font-medium text-accent hover:underline">
              Teacher orientation guide →
            </Link>
          </li>
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
              Bring Locker to your school.
            </h2>
            <p className="relative mt-3 text-accent-fg/80">
              Start with one class. No school-wide rollout required to try it.
            </p>
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
