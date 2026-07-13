"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/Button";
import { Input, Label } from "@/ui/components/Input";
import { verifyEmail, resendVerificationCode } from "@/core/auth/actions";
import { isRedirectError } from "@/lib/isRedirectError";
import { takePendingPassword } from "@/core/auth/pendingPassword";

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [resending, startResend] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Arriving here always follows a just-sent code (signup, or the login
  // page's resend link) — start the cooldown immediately rather than
  // guessing/fetching the real last-sent time.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const formRef = useRef<HTMLFormElement>(null);
  // A synchronous lock, not React state: `disabled={pending}` only takes
  // effect after a re-render, which leaves a brief window where a fast
  // double-tap (common on mobile) fires two submissions before the button
  // visually disables. This ref blocks the second one instantly. The server
  // is also race-safe on its own (see verifyEmail), but stopping the
  // duplicate request at the source is cheaper and faster for the user.
  const submittingRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  return (
    <form
      ref={formRef}
      action={(fd) => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        start(async () => {
          setError(null);
          fd.set("email", email);
          const password = takePendingPassword(email);
          if (password) fd.set("password", password);
          try {
            const result = await verifyEmail(fd);
            if (result?.error) setError(result.error);
          } catch (e) {
            if (isRedirectError(e)) throw e;
            setError(e instanceof Error ? e.message : "Something went wrong");
          } finally {
            submittingRef.current = false;
          }
        });
      }
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

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Verifying…" : "Verify email"}
      </Button>

      <button
        type="button"
        disabled={resending || cooldown > 0}
        onClick={() =>
          startResend(async () => {
            setError(null);
            try {
              const result = await resendVerificationCode(email);
              if (result?.error) {
                setError(result.error);
                return;
              }
              setCooldown(RESEND_COOLDOWN_SECONDS);
              router.refresh();
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
