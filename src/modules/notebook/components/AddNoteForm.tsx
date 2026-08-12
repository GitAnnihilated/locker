"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Select, Textarea } from "@/ui/components/Input";
import { addStudentNote } from "../actions";

const CATEGORIES = [
  { value: "GENERAL", label: "General" },
  { value: "BEHAVIOR", label: "Behavior" },
  { value: "PARTICIPATION", label: "Participation" },
  { value: "HOMEWORK", label: "Homework" },
  { value: "ACHIEVEMENT", label: "Achievement" },
];

/** Deliberately tiny — a few seconds to log, not a form to dread. */
export function AddNoteForm({ classId, studentId }: { classId: string; studentId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(fd) =>
        start(async () => {
          setError(null);
          const result = await addStudentNote(classId, studentId, fd);
          if (result?.error) setError(result.error);
          else formRef.current?.reset();
        })
      }
      className="flex flex-col gap-2 sm:flex-row sm:items-start"
    >
      <Select name="category" defaultValue="GENERAL" className="sm:w-40">
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </Select>
      <Textarea name="content" placeholder="Quick note about this student…" required className="flex-1" />
      <Button type="submit" disabled={pending} className="sm:self-start">
        {pending ? "Saving…" : "Add note"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
