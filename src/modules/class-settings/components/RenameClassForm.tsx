"use client";

import { useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";
import { renameClass } from "@/core/membership/actions";

export function RenameClassForm({ classId, currentName }: { classId: string; currentName: string }) {
  const [pending, start] = useTransition();

  return (
    <form
      action={(fd) => start(() => renameClass(classId, fd))}
      className="flex gap-2"
    >
      <Input name="name" defaultValue={currentName} required />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
