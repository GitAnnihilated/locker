"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/Button";
import { Input, Textarea, Label, Select } from "@/ui/components/Input";
import { createGroup } from "@/modules/groups/actions";
import { isRedirectError } from "@/lib/isRedirectError";

/**
 * College's group-creation form — a course picker plus the same fields
 * CreateGroupDialog already collects, since a college student belongs to
 * many courses and has to say which one a new group is for.
 */
export function CreateKindGroupForm({
  courses,
  kind,
}: {
  courses: { classId: string; name: string; courseCode: string | null }[];
  kind: "PROJECT" | "STUDY";
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (courses.length === 0) {
    return <p className="text-sm text-subtle">Join a course first to create a {kind === "STUDY" ? "study" : "project"} group.</p>;
  }

  return (
    <form
      ref={formRef}
      action={(fd) =>
        start(async () => {
          setError(null);
          const classId = String(fd.get("classId"));
          try {
            const result = await createGroup(fd, classId, kind);
            if (result?.error) setError(result.error);
          } catch (e) {
            if (isRedirectError(e)) throw e;
            setError(e instanceof Error ? e.message : "Something went wrong");
          }
        })
      }
      className="space-y-3"
    >
      <div>
        <Label htmlFor="classId">Course</Label>
        <Select id="classId" name="classId" required>
          {courses.map((c) => (
            <option key={c.classId} value={c.classId}>
              {c.courseCode ? `${c.courseCode} — ${c.name}` : c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" placeholder={kind === "STUDY" ? "Midterm review crew" : "Final project team"} required />
      </div>
      <div>
        <Label htmlFor="subject">Topic (optional)</Label>
        <Input id="subject" name="subject" placeholder="e.g. Chapter 5-7" />
      </div>
      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" name="description" placeholder="What's this group for?" />
      </div>
      {kind === "PROJECT" && (
        <div>
          <Label htmlFor="dueAt">Due date (optional)</Label>
          <Input id="dueAt" name="dueAt" type="date" />
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating…" : `Create ${kind === "STUDY" ? "study" : "project"} group`}
      </Button>
    </form>
  );
}
