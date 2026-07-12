import { Eyebrow } from "./Eyebrow";
import { Avatar } from "@/ui/components/Avatar";

/**
 * Locker hasn't launched yet — there are no real students to quote. Inventing
 * fake names and quotes here would be dishonest marketing copy, so this is a
 * deliberately labeled placeholder instead of fabricated testimonials.
 */
export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="max-w-xl">
        <Eyebrow>From the first classes</Eyebrow>
        <h2 className="mt-3 text-3xl font-bold text-balance sm:text-4xl">
          We&apos;re just getting started.
        </h2>
        <p className="mt-4 text-lg text-subtle">
          Locker is pre-launch — this space is reserved for real quotes from
          real students, once there are some to share.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-dashed border-border p-5">
            <div className="flex gap-0.5 text-brand-orange">
              {"★★★★★".split("").map((s, j) => (
                <span key={j} className="opacity-30">{s}</span>
              ))}
            </div>
            <p className="mt-3 text-sm text-faint">
              Your class could be the first one featured here.
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              <Avatar name={null} size={28} />
              <span className="text-xs text-faint">Reserved for a future student</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
