"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/Button";
import { Input, Label } from "@/ui/components/Input";
import { requestPasswordReset } from "@/core/auth/passwordReset";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null);
          const email = String(fd.get("email") ?? "").trim().toLowerCase();
          try {
            await requestPasswordReset(fd);
            // Same next step whether or not an account actually exists —
            // requestPasswordReset never reveals which, on purpose.
            router.push(`/reset-password?email=${encodeURIComponent(email)}`);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
          }
        })
      }
      className="space-y-3 text-left"
    >
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoFocus />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset code"}
      </Button>
    </form>
  );
}
