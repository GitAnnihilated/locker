"use client";

import { useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { GradeSectionSelect } from "@/core/membership/components/GradeSectionSelect";
import { parseClassName } from "@/core/membership/classNaming";
import { renameClass } from "@/core/membership/actions";

export function RenameClassForm({ classId, currentName }: { classId: string; currentName: string }) {
  const [pending, start] = useTransition();
  const current = parseClassName(currentName);

  return (
    <form
      action={(fd) => start(() => renameClass(classId, fd))}
      className="space-y-3"
    >
      <GradeSectionSelect defaultGrade={current?.grade} defaultSection={current?.section} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
