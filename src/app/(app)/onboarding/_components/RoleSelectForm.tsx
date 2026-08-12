"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/ui/components/Card";
import { setUserRole } from "@/core/education/role";
import type { UserRole } from "@prisma/client";

const OPTIONS: { role: UserRole; icon: string; label: string; description: string }[] = [
  { role: "STUDENT", icon: "🎒", label: "Student", description: "Join classes, discussions, and study groups." },
  { role: "TEACHER", icon: "🧑‍🏫", label: "Teacher", description: "Create classes and run PTMs for your students." },
  { role: "PRINCIPAL", icon: "🏛️", label: "Principal", description: "Set up the school for your teachers." },
];

/** SCHOOL-only onboarding step, asked once — see core/education/role.ts. */
export function RoleSelectForm() {
  const router = useRouter();
  const [pending, start] = useTransition();

  function choose(role: UserRole) {
    start(async () => {
      await setUserRole(role);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {OPTIONS.map((o) => (
        <button key={o.role} type="button" disabled={pending} onClick={() => choose(o.role)} className="text-left">
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
