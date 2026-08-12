import { Eyebrow } from "./Eyebrow";

const POINTS = [
  {
    title: "Real roles, not a free-for-all",
    description: "A Principal sets up the school once; teachers create and own their classes. Students can join, never create one in a teacher's name.",
  },
  {
    title: "A complement, not a replacement",
    description: "Your existing ERP stays the system of record for attendance, notices, and official records. Locker is where the day-to-day coordination happens.",
  },
  {
    title: "Contained by design",
    description: "Marketplace and homework boards stay scoped to your own school — nothing leaks across institutions.",
  },
  {
    title: "Free to pilot",
    description: "No contract, no seat licenses, no minimum commitment to try it with one class.",
  },
];

export function SchoolBenefits() {
  return (
    <section id="schools" className="border-y border-border bg-surface-2">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="max-w-xl">
          <Eyebrow>For schools</Eyebrow>
          <h2 className="mt-3 text-3xl font-bold text-balance sm:text-4xl">
            Built to earn a pilot, not demand one.
          </h2>
          <p className="mt-4 text-lg text-subtle">
            Locker grows one class at a time. You&apos;re never asked to
            roll it out school-wide before it's proven itself.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {POINTS.map((p) => (
            <div key={p.title} className="rounded-lg border border-border bg-surface p-5">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-sm text-subtle">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
