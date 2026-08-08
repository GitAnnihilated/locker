"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/ui/components/Card";
import { setEducationType } from "@/core/education/actions";
import type { EducationType } from "@prisma/client";

const OPTIONS: { type: EducationType; icon: string; label: string; description: string }[] = [
  { type: "SCHOOL", icon: "🏫", label: "School", description: "Grades, classes, and homework." },
  { type: "COLLEGE", icon: "🎓", label: "College / University", description: "Courses, clubs, and campus life." },
];

/** First-time-onboarding step — the only place this question is asked besides Settings. */
export function EducationTypeForm() {
  const router = useRouter();
  const [pending, start] = useTransition();

  function choose(type: EducationType) {
    start(async () => {
      await setEducationType(type);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {OPTIONS.map((o) => (
        <button key={o.type} type="button" disabled={pending} onClick={() => choose(o.type)} className="text-left">
          <Card className="h-full transition duration ease hover:border-accent/40 hover:-translate-y-0.5">
            <CardBody className="flex flex-col items-center gap-2 py-8 text-center">
              <span className="text-4xl">{o.icon}</span>
              <p className="font-semibold">{o.label}</p>
              <p className="text-sm text-subtle">{o.description}</p>
            </CardBody>
          </Card>
        </button>
      ))}
    </div>
  );
}
