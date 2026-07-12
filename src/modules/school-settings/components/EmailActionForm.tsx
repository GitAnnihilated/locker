"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";

/** Generic "act on a user by email" form — reused for assigning moderators and transferring ownership. */
export function EmailActionForm({
  action,
  placeholder,
  buttonLabel,
  buttonVariant = "primary",
  confirmMessage,
}: {
  action: (formData: FormData) => Promise<void>;
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
              await action(fd);
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
