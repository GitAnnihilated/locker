"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";
import { createClass } from "@/core/membership/actions";
import { isRedirectError } from "@/lib/isRedirectError";

/** Submitting makes the student the Class Founder immediately — no approval step. */
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
              await createClass(schoolId, fd);
            } catch (e) {
              if (isRedirectError(e)) throw e; // success — let the redirect happen
              setError(e instanceof Error ? e.message : "Something went wrong");
            }
          })
        }
        className="flex gap-2"
      >
        <Input name="name" placeholder="e.g. Grade 10-B" required />
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create class"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
