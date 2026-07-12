"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Label } from "@/ui/components/Input";
import { resetPassword, resendPasswordResetCode } from "@/core/auth/passwordReset";
import { isRedirectError } from "@/lib/isRedirectError";

const RESEND_COOLDOWN_SECONDS = 60;

export function ResetPasswordForm({ email }: { email: string }) {
  const [pending, start] = useTransition();
  const [resending, startResend] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null);
          fd.set("email", email);
          try {
            await resetPassword(fd);
          } catch (e) {
            if (isRedirectError(e)) throw e;
            setError(e instanceof Error ? e.message : "Something went wrong");
          }
        })
      }
      className="space-y-3 text-left"
    >
      <div>
        <Label htmlFor="code">6-digit code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="[0-9]{6}"
          placeholder="123456"
          required
          className="text-center text-lg tracking-[0.5em]"
        />
      </div>
      <div>
        <Label htmlFor="newPassword">New password</Label>
        <Input id="newPassword" name="newPassword" type="password" minLength={8} required />
        <p className="mt-1 text-xs text-faint">
          At least 8 characters, with an uppercase letter, a lowercase letter, and a number.
        </p>
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Resetting…" : "Reset password"}
      </Button>

      <button
        type="button"
        disabled={resending || cooldown > 0}
        onClick={() =>
          startResend(async () => {
            setError(null);
            try {
              await resendPasswordResetCode(email);
              setCooldown(RESEND_COOLDOWN_SECONDS);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Couldn't resend the code");
            }
          })
        }
        className="w-full text-center text-sm font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:text-faint disabled:no-underline"
      >
        {resending
          ? "Sending…"
          : cooldown > 0
            ? `Resend code in ${cooldown}s`
            : "Resend code"}
      </button>
    </form>
  );
}
