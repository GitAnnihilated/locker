"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Label } from "@/ui/components/Input";
import { signUpWithCredentials } from "@/core/auth/actions";
import { isRedirectError } from "@/lib/isRedirectError";

export function SignUpForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <form
        action={(fd) =>
          start(async () => {
            setError(null);
            try {
              await signUpWithCredentials(fd);
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
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
