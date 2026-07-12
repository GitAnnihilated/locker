"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/ui/components/Button";
import { Input, Label } from "@/ui/components/Input";
import { signInWithCredentials, resendVerificationCode } from "@/core/auth/actions";
import { isRedirectError } from "@/lib/isRedirectError";

const UNVERIFIED_MESSAGE = "Please verify your email before signing in.";

export function CredentialsSignInForm() {
  const [pending, start] = useTransition();
  const [resending, startResend] = useTransition();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<"idle" | "sent">("idle");

  return (
    <div>
      <form
        action={(fd) =>
          start(async () => {
            setError(null);
            setResendStatus("idle");
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
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="mb-1.5">
              Password
            </Label>
            <Link href="/forgot-password" className="mb-1.5 text-xs font-medium text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" required />
        </div>

        {error && (
          <div>
            <p className="text-sm text-danger">{error}</p>
            {error === UNVERIFIED_MESSAGE && (
              <button
                type="button"
                disabled={resending || resendStatus === "sent"}
                onClick={() =>
                  startResend(async () => {
                    try {
                      await resendVerificationCode(email);
                      setResendStatus("sent");
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Couldn't resend the code");
                    }
                  })
                }
                className="mt-1 text-sm font-medium text-accent hover:underline disabled:no-underline disabled:opacity-60"
              >
                {resendStatus === "sent"
                  ? "Code sent — check your email"
                  : resending
                    ? "Sending…"
                    : "Resend verification email"}
              </button>
            )}
            {error === UNVERIFIED_MESSAGE && resendStatus === "sent" && (
              <p className="mt-1 text-sm">
                <Link href={`/verify-email?email=${encodeURIComponent(email)}`} className="font-medium text-accent hover:underline">
                  Enter your code →
                </Link>
              </p>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
