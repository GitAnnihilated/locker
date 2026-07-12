"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Label } from "@/ui/components/Input";
import { signInWithCredentials } from "@/core/auth/actions";
import { isRedirectError } from "@/lib/isRedirectError";

export function CredentialsSignInForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <form
        action={(fd) =>
          start(async () => {
            setError(null);
            try {
              await signInWithCredentials(fd);
            } catch (e) {
              if (isRedirectError(e)) throw e;
              setError(e instanceof Error ? e.message : "Something went wrong");
            }
          })
        }
        className="space-y-3 text-left"
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
