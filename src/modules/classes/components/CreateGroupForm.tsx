"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";
import { createClassGroup } from "../actions";

type TaughtClass = { id: string; name: string; subject: string };

/** Pick 2+ classes you teach and name the bundle — the compound-class MVP. */
export function CreateGroupForm({ schoolId, classes }: { schoolId: string; classes: TaughtClass[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  if (classes.length < 2) {
    return <p className="text-sm text-subtle">Teach at least 2 classes to bundle them into a group.</p>;
  }

  return (
    <form
      ref={formRef}
      action={(fd) =>
        start(async () => {
          setError(null);
          selected.forEach((id) => fd.append("classIds", id));
          const result = await createClassGroup(schoolId, fd);
          if (result?.error) setError(result.error);
          else {
            formRef.current?.reset();
            setSelected([]);
          }
        })
      }
      className="space-y-3"
    >
      <Input name="name" placeholder="e.g. Grade 10 Mathematics" required />
      <div className="grid gap-2 sm:grid-cols-2">
        {classes.map((c) => (
          <label key={c.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
            {c.subject} — {c.name}
          </label>
        ))}
      </div>
      <Button type="submit" disabled={pending || selected.length < 2}>
        {pending ? "Creating…" : "Create group"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
