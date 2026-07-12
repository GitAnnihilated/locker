"use client";

import { useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";
import { editSchoolInfo } from "@/core/school/actions";

export function EditSchoolNameForm({ schoolId, currentName }: { schoolId: string; currentName: string }) {
  const [pending, start] = useTransition();

  return (
    <form action={(fd) => start(() => editSchoolInfo(schoolId, fd))} className="flex gap-2">
      <Input name="name" defaultValue={currentName} required />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
