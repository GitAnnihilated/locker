"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Label } from "@/ui/components/Input";
import { completeProfileSetup } from "@/core/auth/actions";
import { isRedirectError } from "@/lib/isRedirectError";

export function ProfileSetupForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null);
          try {
            await completeProfileSetup(fd);
          } catch (e) {
            if (isRedirectError(e)) throw e;
            setError(e instanceof Error ? e.message : "Something went wrong");
          }
        })
      }
      className="space-y-3 text-left"
    >
      <div>
        <Label htmlFor="name">Real full name</Label>
        <Input id="name" name="name" placeholder="e.g. Priya Sharma" required />
      </div>
      <div>
        <Label htmlFor="nickname">Nickname (optional)</Label>
        <Input id="nickname" name="nickname" placeholder="What friends call you" />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
