import { Eyebrow } from "./Eyebrow";

const FAQS = [
  {
    q: "Is Locker free?",
    a: "Yes. Creating a school, a class, and using every current module costs nothing.",
  },
  {
    q: "Does my school need to sign up first?",
    a: "No. Any student can create their school and class the moment they sign up — there's no approval step blocking you from starting.",
  },
  {
    q: "What if someone I don't know joins my class?",
    a: "Joining always requires an invite code from someone already in the class — there's no public directory of classes to browse into.",
  },
  {
    q: "Can a class remove someone who's causing problems?",
    a: "Yes. Class Founders and moderators can remove members, and a School Founder can remove an entire spam class if needed.",
  },
  {
    q: "What happens to my data?",
    a: "Your homework, marketplace listings, and achievements stay tied to your account and your class — they're not shared outside your school.",
  },
  {
    q: "Is there a teacher account?",
    a: "Not yet — it's on the roadmap. For now, classes are created and run by students.",
  },
];

/** Native <details>/<summary> — a real accordion with zero client-side JavaScript. */
export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
      <div className="text-center">
        <Eyebrow>Questions</Eyebrow>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Good to know</h2>
      </div>

      <div className="mt-10 divide-y divide-border rounded-lg border border-border bg-surface">
        {FAQS.map((item) => (
          <details key={item.q} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {item.q}
              <span className="shrink-0 text-faint transition duration ease group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-subtle">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
