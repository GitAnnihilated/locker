"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/Button";
import { setEducationType } from "@/core/education/actions";
import type { EducationType } from "@prisma/client";

const OPTIONS: { type: EducationType; icon: string; label: string }[] = [
  { type: "SCHOOL", icon: "🏫", label: "School" },
  { type: "COLLEGE", icon: "🎓", label: "College / University" },
];

/**
 * Switching is explicitly NOT a destructive migration — it only ever
 * updates this one column (see core/education/actions.ts). No School/
 * Class/Homework/Group/etc. row from either experience is ever touched,
 * so nothing is lost switching either direction, any number of times.
 */
export function EducationTypeSettingsForm({ current }: { current: EducationType }) {
  const router = useRouter();
  const [selected, setSelected] = useState<EducationType>(current);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const changed = selected !== current;

  function save() {
    setSaved(false);
    start(async () => {
      await setEducationType(selected);
      setSaved(true);
      // Nav/dashboard/module list are all server-rendered off this value —
      // a refresh is enough to pick it up everywhere, no logout needed.
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {OPTIONS.map((o) => (
          <label
            key={o.type}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2.5 transition duration ease hover:border-accent/40 has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
          >
            <input
              type="radio"
              name="educationType"
              value={o.type}
              checked={selected === o.type}
              onChange={() => setSelected(o.type)}
              className="accent-current"
            />
            <span className="text-lg">{o.icon}</span>
            <span className="text-sm font-medium">{o.label}</span>
          </label>
        ))}
      </div>

      {changed && (
        <p className="rounded-md bg-warning-soft px-3 py-2 text-xs text-warning">
          This changes your navigation, dashboard, and terminology across Locker. Your existing
          {selected === "COLLEGE" ? " school " : " college "}
          data isn&apos;t deleted — you can switch back anytime.
        </p>
      )}

      <Button onClick={save} disabled={!changed || pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      {saved && !pending && <span className="ml-3 text-sm text-success">Saved.</span>}
    </div>
  );
}
