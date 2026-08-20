import Link from "next/link";
import { Card, CardBody } from "@/ui/components/Card";
import { Eyebrow } from "./Eyebrow";

const FEATURES = [
  {
    icon: "📚",
    tint: "accent" as const,
    title: "Homework",
    description: "A shared board that's only complete once your whole class fills it in — miss a class, it's already there.",
    href: "/features/homework",
  },
  {
    icon: "👥",
    tint: "lime" as const,
    title: "Group Finder",
    description: "Real project and study workspaces — tasks, resources, and chat, not just a headcount.",
    href: "/features/groups",
  },
  {
    icon: "🗓️",
    tint: "orange" as const,
    title: "Parent-Teacher Meetings",
    description: "Teachers open timeslots; students and parents book what's free. No back-and-forth to schedule one.",
  },
  {
    icon: "🛍️",
    tint: "orange" as const,
    title: "Marketplace",
    description: "Buy and sell books and gear within your school. No fees, no strangers off-campus.",
    href: "/features/marketplace",
  },
  {
    icon: "🏅",
    tint: "accent" as const,
    title: "Achievements",
    description: "A real portfolio of what you've actually earned — competitions, certifications, awards.",
    href: "/features/achievements",
  },
  {
    icon: "🏆",
    tint: "orange" as const,
    title: "Rewards",
    description: "Points, streaks, and a perk store — the fun layer, kept separate from your real accomplishments.",
  },
  {
    icon: "💬",
    tint: "lime" as const,
    title: "Messages",
    description: "Direct messages with anyone in your school — classmates, project teammates, or your teacher.",
  },
];

const TINT_CLASSES = {
  accent: "bg-accent-soft text-accent",
  orange: "bg-brand-orange-soft text-brand-orange",
  lime: "bg-brand-lime-soft text-brand-lime",
};

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="max-w-xl">
        <Eyebrow>What&apos;s inside</Eyebrow>
        <h2 className="mt-3 text-3xl font-bold text-balance sm:text-4xl">
          Seven tools. One place to open.
        </h2>
        <p className="mt-4 text-lg text-subtle">
          Not a suite bolted together — Locker was built as one thing from the start.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => {
          const card = (
            <Card className="h-full transition duration ease hover:-translate-y-0.5 hover:shadow-md">
              <CardBody>
                <span className={`flex h-11 w-11 items-center justify-center rounded-lg text-xl ${TINT_CLASSES[f.tint]}`}>
                  {f.icon}
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-subtle">{f.description}</p>
              </CardBody>
            </Card>
          );

          // Only the four features with a dedicated public landing page
          // link out — the rest (PTMs, Rewards, Messages) stay plain
          // cards rather than linking to a page that doesn't exist yet.
          return f.href ? (
            <Link key={f.title} href={f.href} aria-label={`Learn more about ${f.title}`}>
              {card}
            </Link>
          ) : (
            <div key={f.title}>{card}</div>
          );
        })}
      </div>
    </section>
  );
}
