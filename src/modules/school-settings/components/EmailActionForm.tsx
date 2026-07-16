"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";

/**
 * Generic "act on a user by email" form — reused for assigning moderators
 * and transferring ownership. `action` must be the actual Server Action
 * reference (e.g. `assignSchoolModerator`), not a closure wrapping it — an
 * inline arrow function crossing the Server->Client boundary as a prop
 * isn't a valid Server Action reference and crashes the render. `schoolId`
 * is passed alongside so the component can call `action(schoolId, formData)`
 * itself instead of the caller pre-binding it in a closure.
 */
export function EmailActionForm({
  schoolId,
  action,
  placeholder,
  buttonLabel,
  buttonVariant = "primary",
  confirmMessage,
}: {
  schoolId: string;
  action: (schoolId: string, formData: FormData) => Promise<{ error: string } | undefined>;
  placeholder: string;
  buttonLabel: string;
  buttonVariant?: "primary" | "secondary" | "danger";
  confirmMessage?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <form
        action={(fd) =>
          start(async () => {
            setError(null);
            if (confirmMessage && !confirm(confirmMessage)) return;
            try {
              const result = await action(schoolId, fd);
              if (result?.error) setError(result.error);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Something went wrong");
            }
          })
        }
        className="flex gap-2"
      >
        <Input name="email" type="email" placeholder={placeholder} required />
        <Button type="submit" variant={buttonVariant} disabled={pending}>
          {pending ? "Working…" : buttonLabel}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
