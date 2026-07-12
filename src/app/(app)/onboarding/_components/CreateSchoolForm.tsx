"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";
import { createSchool } from "@/core/school/actions";

/** No approval step: submitting this makes the student the School Founder immediately. */
export function CreateSchoolForm() {
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <form
        ref={ref}
        action={(fd) =>
          start(async () => {
            setError(null);
            try {
              const school = await createSchool(fd);
              router.push(`/onboarding?school=${school.id}`);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Something went wrong");
            }
          })
        }
        className="flex gap-2"
      >
        <Input name="name" placeholder="e.g. Lincoln High School" required />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Creating…" : "Create school"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
