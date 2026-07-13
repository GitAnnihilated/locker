"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";
import { editSchoolInfo } from "@/core/school/actions";

export function EditSchoolNameForm({ schoolId, currentName }: { schoolId: string; currentName: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <form
        action={(fd) =>
          start(async () => {
            const result = await editSchoolInfo(schoolId, fd);
            setError(result?.error ?? null);
          })
        }
        className="flex gap-2"
      >
        <Input name="name" defaultValue={currentName} required />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
