import { Eyebrow } from "./Eyebrow";

const STEPS = [
  {
    n: "01",
    title: "Create your account",
    description: "Sign up with your email, then tell us if you're a student, teacher, or Principal/IT Admin.",
  },
  {
    n: "02",
    title: "Find or set up your school",
    description: "Search for your school. Principals/IT Admins create it if it's not there yet — everyone else just joins.",
  },
  {
    n: "03",
    title: "Create or join your class",
    description: "Teachers create a class and get an invite code instantly. Students join with that code.",
  },
  {
    n: "04",
    title: "Invite everyone in",
    description: "The more of your class that joins, the more useful every board, list, and PTM slot becomes.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="max-w-xl">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-3 text-3xl font-bold text-balance sm:text-4xl">
          Four steps. No IT ticket required.
        </h2>
      </div>

      <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.n} className="relative">
            <span className="text-3xl font-bold text-border-strong">{s.n}</span>
            <h3 className="mt-3 font-semibold">{s.title}</h3>
            <p className="mt-1.5 text-sm text-subtle">{s.description}</p>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute right-[-1.25rem] top-3 hidden text-border-strong lg:block"
              >
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
