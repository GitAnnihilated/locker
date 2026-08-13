"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";
import { joinClassAsTeacher } from "@/core/membership/actions";

/** Inline "what subject do you teach here?" + join, for one row in the browse list. */
export function JoinClassForm({ classId }: { classId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(fd) =>
        start(async () => {
          setError(null);
          const result = await joinClassAsTeacher(classId, fd);
          setError(result?.error ?? null);
        })
      }
      className="flex items-center gap-2"
    >
      <Input name="subject" placeholder="Your subject" required className="h-9 w-36" />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Joining…" : "Join"}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}
