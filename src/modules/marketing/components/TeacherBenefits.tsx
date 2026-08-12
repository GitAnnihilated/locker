import { Eyebrow } from "./Eyebrow";

const BENEFITS = [
  {
    icon: "🏫",
    title: "Create your classes, own them",
    description: "Set up a class, assign the subject, and get an invite code instantly — no student can create one in your name.",
  },
  {
    icon: "🗓️",
    title: "Run PTMs without the back-and-forth",
    description: "Open a set of timeslots once; students and parents book what's free. No more juggling calls to schedule one.",
  },
  {
    icon: "🧑‍🤝‍🧑",
    title: "See your whole roster at a glance",
    description: "Every class you teach, its subject, and who's in it — nothing else cluttering the view.",
  },
  {
    icon: "💬",
    title: "Reach your class directly",
    description: "Message students and colleagues without leaving Locker or hunting for a phone number.",
  },
];

export function TeacherBenefits() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <Eyebrow>For teachers</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold text-balance sm:text-4xl">
            Your classes, your roster, your PTMs — not a portal to fight with.
          </h2>
          <p className="mt-4 text-lg text-subtle">
            Locker doesn't replace your school's existing systems. It's the
            place where the day-to-day coordination actually happens.
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
