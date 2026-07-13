"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";
import { joinClassByCode } from "@/core/membership/actions";
import { isRedirectError } from "@/lib/isRedirectError";

export function JoinByCodeForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <form
        action={(fd) =>
          start(async () => {
            setError(null);
            try {
              const result = await joinClassByCode(fd);
              if (result?.error) setError(result.error);
            } catch (e) {
              if (isRedirectError(e)) throw e; // success — let the redirect happen
              setError(e instanceof Error ? e.message : "Something went wrong");
            }
          })
        }
        className="flex gap-2"
      >
        <Input name="code" placeholder="ABC123" className="uppercase" required />
        <Button type="submit" disabled={pending}>
          {pending ? "Joining…" : "Join"}
        </Button>
      </form>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
