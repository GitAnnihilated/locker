"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { GradeSectionSelect } from "@/core/membership/components/GradeSectionSelect";
import { createClass } from "@/core/membership/actions";
import { isRedirectError } from "@/lib/isRedirectError";

/** Submitting makes the teacher the Class Founder/teacher-of-record immediately. */
export function CreateClassForm({ schoolId }: { schoolId: string }) {
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
        <GradeSectionSelect showSubject />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating…" : "Create class"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
