"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { GradeSectionSelect } from "@/core/membership/components/GradeSectionSelect";
import { CourseNameFields } from "@/core/membership/components/CourseNameFields";
import { parseClassName } from "@/core/membership/classNaming";
import { renameClass } from "@/core/membership/actions";
import type { EducationType } from "@prisma/client";

export function RenameClassForm({
  classId,
  currentName,
  currentCourseCode,
  educationType,
}: {
  classId: string;
  currentName: string;
  currentCourseCode?: string | null;
  educationType: EducationType;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const current = parseClassName(currentName);

  return (
    <form
      action={(fd) =>
        start(async () => {
          const result = await renameClass(classId, fd);
          setError(result?.error ?? null);
        })
      }
      className="space-y-3"
    >
      {educationType === "COLLEGE" ? (
        <CourseNameFields defaultName={currentName} defaultCourseCode={currentCourseCode ?? undefined} />
      ) : (
        <GradeSectionSelect defaultGrade={current?.grade} defaultSection={current?.section} />
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
