import { Card, CardBody } from "@/ui/components/Card";
import { Eyebrow } from "./Eyebrow";

const FEATURES = [
  {
    icon: "📚",
    tint: "accent" as const,
    title: "Homework",
    description: "A shared board that's only complete once your whole class fills it in — miss a class, it's already there.",
  },
  {
    icon: "🛍️",
    tint: "orange" as const,
    title: "Marketplace",
    description: "Buy and sell books and gear within your school. No fees, no strangers off-campus.",
  },
  {
    icon: "👥",
    tint: "lime" as const,
    title: "Groups",
    description: "Real project workspaces — tasks, resources, and progress tracking, not just a headcount.",
  },
  {
    icon: "🏅",
    tint: "accent" as const,
    title: "Achievements",
    description: "A real portfolio of what you've actually earned — competitions, certifications, awards.",
  },
  {
    icon: "🎖️",
    tint: "orange" as const,
    title: "Badges",
    description: "Streaks and milestones for showing up — the fun layer, kept separate from your real accomplishments.",
  },
  {
    icon: "💬",
    tint: "lime" as const,
    title: "Group Chat",
    description: "Talk directly inside your project group, without leaving the workspace.",
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
          Six tools. One place to open.
        </h2>
        <p className="mt-4 text-lg text-subtle">
          Not a suite bolted together — Locker was built as one thing from the start.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} className="transition duration ease hover:-translate-y-0.5 hover:shadow-md">
            <CardBody>
              <span className={`flex h-11 w-11 items-center justify-center rounded-lg text-xl ${TINT_CLASSES[f.tint]}`}>
                {f.icon}
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-subtle">{f.description}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
