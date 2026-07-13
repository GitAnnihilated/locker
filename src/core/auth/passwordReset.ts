"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/core/db/client";
import { generateOtp } from "@/lib/ids";
import { sendPasswordResetEmail } from "@/core/email/send";
import { CODE_TTL_MS, RESEND_COOLDOWN_MS, MAX_CODE_ATTEMPTS } from "./constants";

const emailSchema = z.object({ email: z.string().email("Enter a valid email") });

/**
 * Deliberately never reveals whether an account exists for that email — the
 * client always shows the same "if an account exists, we sent a code"
 * message. Only *finding* a user actually sends anything.
 *
 * Returns `{ error }` instead of throwing for expected/user-facing
 * failures: Next.js redacts thrown Server Action errors down to a generic
 * "omitted in production" message in production builds.
 */
export async function requestPasswordReset(formData: FormData): Promise<{ error: string } | undefined> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Enter a valid email" };

  const email = parsed.data.email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return; // silent no-op — anti-enumeration

  const now = new Date();
  const active = await db.passwordResetCode.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  // Respect the resend cooldown even on this first request, in case of a
  // double-submitted form — just don't send a second email.
  if (active && active.lastSentAt.getTime() > now.getTime() - RESEND_COOLDOWN_MS) return;

  const code = generateOtp();
  const codeExpiresAt = new Date(now.getTime() + CODE_TTL_MS);

  if (active) {
    await db.passwordResetCode.update({
      where: { id: active.id },
      data: { code, codeExpiresAt, attempts: 0, lastSentAt: now },
    });
  } else {
    await db.passwordResetCode.create({
      data: { userId: user.id, code, codeExpiresAt, lastSentAt: now },
    });
  }

  await sendPasswordResetEmail(email, user.name, code);
}

/** Same cooldown/no-enumeration rules as requestPasswordReset. */
export async function resendPasswordResetCode(email: string): Promise<{ error: string } | undefined> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return;

  const now = new Date();
  const active = await db.passwordResetCode.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!active) return; // nothing to resend — they should restart from "forgot password"

  const msSinceLastSend = now.getTime() - active.lastSentAt.getTime();
  if (msSinceLastSend < RESEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - msSinceLastSend) / 1000);
    return { error: `Please wait ${waitSeconds}s before requesting another code.` };
  }

  const code = generateOtp();
  await db.passwordResetCode.update({
    where: { id: active.id },
    data: { code, codeExpiresAt: new Date(now.getTime() + CODE_TTL_MS), attempts: 0, lastSentAt: now },
  });

  await sendPasswordResetEmail(normalizedEmail, user.name, code);
}

const resetSchema = z
  .object({
    email: z.string().email(),
    code: z.string().length(6),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72)
      .regex(/[a-z]/, "Password needs a lowercase letter")
      .regex(/[A-Z]/, "Password needs an uppercase letter")
      .regex(/[0-9]/, "Password needs a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function resetPassword(formData: FormData): Promise<{ error: string } | undefined> {
  const parsed = resetSchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  // Same message whether the email doesn't exist or the code is wrong —
  // no reason to distinguish for an attacker probing this form.
  const invalidCodeError = { error: "Invalid or expired code." };
  if (!user) return invalidCodeError;

  const resetCode = await db.passwordResetCode.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!resetCode) return invalidCodeError;
  if (resetCode.codeExpiresAt < new Date()) {
    return { error: "This code has expired. Request a new one." };
  }
  if (resetCode.attempts >= MAX_CODE_ATTEMPTS) {
    return { error: "Too many incorrect attempts. Request a new code." };
  }
  if (resetCode.code !== parsed.data.code) {
    await db.passwordResetCode.update({
      where: { id: resetCode.id },
      data: { attempts: { increment: 1 } },
    });
    return { error: "That code doesn't match. Please try again." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
    }),
    db.passwordResetCode.update({
      where: { id: resetCode.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login?reset=1");
}
