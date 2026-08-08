"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Textarea, Label } from "@/ui/components/Input";
import { createHomework } from "@/modules/homework/actions";

/** Course-scoped variant of HomeworkForm — passes classId explicitly so it never
 * lands on the wrong course (a College student has many, not one active class). */
export function CourseAssignmentForm({ classId }: { classId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={formRef}
      action={(fd) =>
        start(async () => {
          const result = await createHomework(fd, classId);
          if (result?.error) {
            setError(result.error);
            return;
          }
          setError(null);
          formRef.current?.reset();
        })
      }
      className="space-y-3"
    >
      <div>
        <Label htmlFor="title">Assignment</Label>
        <Input id="title" name="title" placeholder="e.g. Problem set 3" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="subject">Topic</Label>
          <Input id="subject" name="subject" placeholder="Optional" />
        </div>
        <div>
          <Label htmlFor="dueAt">Due date</Label>
          <Input id="dueAt" name="dueAt" type="date" />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Notes (optional)</Label>
        <Textarea id="description" name="description" placeholder="Anything classmates should know" />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Adding…" : "Add assignment"}
      </Button>
    </form>
  );
}
