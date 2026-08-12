"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";
import { createTask } from "../actions";

export function CreateTaskForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(fd) =>
        start(async () => {
          setError(null);
          const result = await createTask(fd);
          if (result?.error) setError(result.error);
          else formRef.current?.reset();
        })
      }
      className="flex flex-col gap-2 sm:flex-row"
    >
      <Input name="title" placeholder="Something someone asked you to do…" required className="flex-1" />
      <Input name="dueAt" type="date" className="sm:w-40" />
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
