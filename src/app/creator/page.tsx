import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/modules/marketing/components/MarketingHeader";
import { Footer } from "@/modules/marketing/components/Footer";
import { Eyebrow } from "@/modules/marketing/components/Eyebrow";
import { Card, CardBody } from "@/ui/components/Card";
import { Button } from "@/ui/components/Button";
import { Avatar } from "@/ui/components/Avatar";

export const metadata: Metadata = {
  title: "The Creator",
  description: "Who's building Locker, why, and what it's taught them so far.",
};

const MILESTONES = [
  {
    label: "Idea",
    text: "Noticing how scattered school life actually was — homework, groups, and achievements all living in different places, none of them talking to each other.",
  },
  {
    label: "First prototype",
    text: "A simple shared space for one class. Homework and a marketplace, nothing more — just enough to see if the idea actually held up.",
  },
  {
    label: "Student platform",
    text: "Groups, achievements, rewards. Built around one question: would a student actually open this again tomorrow?",
  },
  {
    label: "Real user feedback",
    text: "Real students meant real opinions. Some ideas got cut, some features only exist because someone specifically asked for them.",
  },
  {
    label: "School + teacher platform",
    text: "Roles for teachers and Principals/IT Admins, real class ownership, parent-teacher meetings — the same platform learning to speak to a whole school, not just one class.",
  },
  {
    label: "Continuous development",
    text: "Still being built, still changing based on what people actually use — this page will look outdated the moment it stops.",
  },
];

const LESSONS = [
  {
    title: "A real product isn't a demo",
    text: "Handling real accounts and real data is a different job than shipping something that just works once in a demo.",
  },
  {
    title: "Feedback changes direction, not just details",
    text: "Some of the most useful parts of Locker exist because a real user asked for exactly that, not because it was planned.",
  },
  {
    title: "Performance is a feature",
    text: "A slow page feels broken even when nothing is actually wrong with it. Speed isn't a nice-to-have, it's part of the product.",
  },
  {
    title: "Simple beats more",
    text: "Adding a feature is easy. Deciding what not to build is harder — and usually matters more.",
  },
  {
    title: "Schools aren't one audience",
    text: "A student, a teacher, and a Principal/IT Admin want genuinely different things from the same app. Designing for all three at once is the actual hard part.",
  },
  {
    title: "Solve the real problem first",
    text: "It's tempting to keep adding before the core thing even works well. The boring, unglamorous stuff has to come first.",
  },
];

export default function CreatorPage() {
  return (
    <main>
      <MarketingHeader />

      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[560px] bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--accent-soft))_0%,transparent_70%)]"
        />
        <div className="mx-auto max-w-3xl px-6 pb-16 pt-16 text-center sm:pb-20 sm:pt-24">
          <Eyebrow className="animate-fade-up">Behind Locker</Eyebrow>
          <h1 className="animate-fade-up reveal-1 mt-4 text-display-sm font-bold text-balance sm:text-display">
            Meet the Creator
          </h1>
          <p className="animate-fade-up reveal-2 mx-auto mt-5 max-w-xl text-lg text-subtle text-pretty">
            Locker started with a simple idea: school software should make life easier
            for the people actually using it.
          </p>

          {/* Dedicated photo/avatar container — swap in a real photo by
              passing `image="/creator-photo.jpg"` to the Avatar below (drop
              the file in /public first). Falls back to initials on its own
              if the image ever 404s, so this is safe to wire up any time. */}
          <div className="animate-scale-in reveal-3 mt-10 flex flex-col items-center gap-3">
            <Avatar name="Rajveer" size={104} className="text-3xl ring-4 ring-surface shadow-md" />
            <div>
              <p className="font-semibold">Rajveer</p>
              <p className="text-sm text-subtle">Founder &amp; Developer</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Founder story                                                     */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <Eyebrow>The story</Eyebrow>
        <h2 className="mt-3 text-3xl font-bold text-balance sm:text-4xl">
          It started as a problem I actually had.
        </h2>
        <div className="mt-6 space-y-4 text-lg text-subtle text-pretty">
          <p>
            Locker began as a student project, not a business plan. School communication is
            scattered by default — homework lives in one group chat, project teams in another,
            and whatever you actually accomplished outside class rarely gets tracked anywhere
            at all. I got tired of that, so I started building something to fix it.
          </p>
          <p>
            The first version was built for students, because that's the side of school I
            actually understood. As real people started using it, the product changed —
            not because of a roadmap, but because of what people actually said, asked for,
            and stopped using.
          </p>
          <p>
            Locker is now growing to support teachers and schools too — but the goal hasn't
            changed. Schools already run on ERPs for attendance and official records, and
            Locker isn't trying to replace that. It's trying to be the layer where the actual
            people in a school — students and teachers — collaborate, without turning into
            another bloated system someone has to maintain.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Building in public — a real, grounded timeline                   */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-border bg-surface-2">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <Eyebrow>The journey so far</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold text-balance sm:text-4xl">
            Built one real step at a time.
          </h2>

          <ol className="mt-10 space-y-0">
            {MILESTONES.map((m, i) => (
              <li key={m.label} className="relative flex gap-5 pb-10 last:pb-0">
                {i < MILESTONES.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-border"
                  />
                )}
                <span className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-surface text-xs font-bold text-accent">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{m.label}</p>
                  <p className="mt-1 text-sm text-subtle">{m.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* What I've learned                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <div className="max-w-xl">
          <Eyebrow>Lessons</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold text-balance sm:text-4xl">
            What building this has actually taught me.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {LESSONS.map((lesson) => (
            <Card key={lesson.title} className="transition duration ease hover:-translate-y-0.5 hover:shadow-md">
              <CardBody>
                <h3 className="font-semibold">{lesson.title}</h3>
                <p className="mt-1.5 text-sm text-subtle">{lesson.text}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Why Locker exists                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-border bg-surface-2">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
          <Eyebrow>Why I&apos;m building this</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold text-balance sm:text-4xl">Why Locker exists.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-subtle text-pretty">
            Less scattered communication. Less repetitive work. Better collaboration between
            students and teachers. Simpler workflows, not more of them. That's the whole
            point — a school already has enough systems. Locker is meant to be the one that
            actually makes the people in it feel less alone in getting things done.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* CTA                                                               */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-xl bg-accent px-8 py-16 text-center sm:px-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_100%,hsl(var(--brand-lime)/0.25)_0%,transparent_70%)]"
          />
          <div className="relative">
            <h2 className="text-3xl font-bold text-balance text-accent-fg sm:text-4xl">
              Want to see what I&apos;m building?
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/">
                <Button size="lg" className="!bg-surface !text-accent shadow-lg hover:!bg-muted">
                  Try Locker
                </Button>
              </Link>
              <Link href="mailto:rajveerpd14@gmail.com">
                <Button size="lg" variant="secondary" className="!bg-accent-strong !text-accent-fg hover:!brightness-110">
                  Give Feedback
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
