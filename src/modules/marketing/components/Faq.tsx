import { Eyebrow } from "./Eyebrow";

const FAQS = [
  {
    q: "Is Locker free?",
    a: "For students and teachers, yes — joining a class, and everything you do inside it, costs nothing. Setting up a school itself is $85/month per school, billed to whoever registers it (typically the Principal/IT Admin). College accounts stay fully free to set up, same as before.",
  },
  {
    q: "Who can create a school or a class?",
    a: "A school is created and owned by its Principal/IT Admin. From there, teachers create and own their own classes. Students join with an invite code — they never need to create anything to get started.",
  },
  {
    q: "Does Locker replace our school's existing ERP?",
    a: "No. If your school already uses a system like Shri Educare for attendance, official notices, or administrative records, that stays the system of record. Locker is the collaboration layer on top — classes, groups, resources, and PTMs — not a replacement.",
  },
  {
    q: "What if someone I don't know joins my class?",
    a: "Joining always requires an invite code from a teacher or classmate already in the class — there's no public directory of classes to browse into.",
  },
  {
    q: "Can a class remove someone who's causing problems?",
    a: "Yes. A class's owner and moderators can remove members, and whoever owns the school (its Principal/IT Admin, or its Founder for a college account) can remove an entire spam class if needed.",
  },
  {
    q: "What happens to my data?",
    a: "Your homework, marketplace listings, and achievements stay tied to your account and your class — they're not shared outside your school.",
  },
  {
    q: "Is Locker only for schools, or colleges too?",
    a: "Both. College and university accounts get their own terminology and modules — courses, project and study groups, clubs, events, and a campus marketplace — built on the same underlying platform.",
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
