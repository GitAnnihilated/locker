"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Label } from "@/ui/components/Input";
import { signUp } from "@/core/auth/actions";
import { isRedirectError } from "@/lib/isRedirectError";
import { stashPendingPassword } from "@/core/auth/pendingPassword";

export function SignUpForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <form
        action={(fd) =>
          start(async () => {
            setError(null);
            const email = String(fd.get("email") ?? "");
            const password = String(fd.get("password") ?? "");
            const confirmPassword = String(fd.get("confirmPassword") ?? "");
            if (password !== confirmPassword) {
              setError("Passwords don't match");
              return;
            }
            try {
              // Stashed client-side only — verifyEmail() uses it purely to
              // auto-sign-in right after verification; it's never sent
              // anywhere or stored until that one submission.
              stashPendingPassword(email, password);
              await signUp(fd);
            } catch (e) {
              if (isRedirectError(e)) throw e;
              setError(e instanceof Error ? e.message : "Something went wrong");
            }
          })
        }
        className="space-y-3 text-left"
      >
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" placeholder="Your real name" required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" minLength={8} required />
          <p className="mt-1 text-xs text-faint">
            At least 8 characters, with an uppercase letter, a lowercase letter, and a number.
          </p>
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
