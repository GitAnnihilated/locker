import { Eyebrow } from "./Eyebrow";

const BENEFITS = [
  {
    icon: "🎯",
    title: "Never miss another assignment",
    description: "Miss a class and the homework's already on the board — added by whoever was there.",
  },
  {
    icon: "🤝",
    title: "Find your project team",
    description: "Post what you need, review requests, and run the whole project in one workspace.",
  },
  {
    icon: "💸",
    title: "Buy and sell without the awkwardness",
    description: "A marketplace scoped to your own school — no random strangers, no shipping.",
  },
  {
    icon: "🏆",
    title: "Get credit for what you've actually done",
    description: "Olympiads, certifications, sports — build a real portfolio, not another leaderboard.",
  },
];

export function StudentBenefits() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <Eyebrow>For students</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold text-balance sm:text-4xl">
            Made for the person actually using it.
          </h2>
          <p className="mt-4 text-lg text-subtle">
            Every decision starts with one question: would a student open
            this again tomorrow?
          </p>
        </div>

        <dl className="grid gap-8 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <div key={b.title}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-lg">
                {b.icon}
              </div>
              <dt className="mt-3 font-semibold">{b.title}</dt>
              <dd className="mt-1 text-sm text-subtle">{b.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
