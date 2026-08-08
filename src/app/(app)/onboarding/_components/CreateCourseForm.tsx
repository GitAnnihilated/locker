"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { CourseNameFields } from "@/core/membership/components/CourseNameFields";
import { createClass } from "@/core/membership/actions";
import { isRedirectError } from "@/lib/isRedirectError";

/** College's equivalent of CreateClassForm — same action, free-text course fields. */
export function CreateCourseForm({ schoolId }: { schoolId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <form
        action={(fd) =>
          start(async () => {
            setError(null);
            try {
              const result = await createClass(schoolId, fd);
              if (result?.error) setError(result.error);
            } catch (e) {
              if (isRedirectError(e)) throw e; // success — let the redirect happen
              setError(e instanceof Error ? e.message : "Something went wrong");
            }
          })
        }
        className="space-y-3"
      >
        <CourseNameFields />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating…" : "Create course"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
