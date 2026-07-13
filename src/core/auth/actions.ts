"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { db } from "@/core/db/client";
import { signIn } from "./auth";
import { generateOtp } from "@/lib/ids";
import { sendVerificationEmail } from "@/core/email/send";
import { CODE_TTL_MS, RESEND_COOLDOWN_MS, MAX_CODE_ATTEMPTS } from "./constants";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72)
  .regex(/[a-z]/, "Password needs a lowercase letter")
  .regex(/[A-Z]/, "Password needs an uppercase letter")
  .regex(/[0-9]/, "Password needs a number");

const signUpSchema = z
  .object({
    name: z.string().min(2, "Enter your full name").max(120),
    email: z.string().email("Enter a valid email"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * Step 1 of signup: never creates a User. Stores a PendingRegistration
 * (password already hashed — plaintext is never written anywhere, even
 * temporarily) and emails a 6-digit code. The real User only exists after
 * verifyEmail succeeds.
 */
export async function signUp(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const email = parsed.data.email.trim().toLowerCase();

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    // They already have an account. Most of the time this is someone who
    // forgot they'd signed up before and just typed their real password
    // again — so try it as a login instead of dead-ending on an error. Only
    // fall back to "go sign in" if the password doesn't actually match.
    try {
      await signIn("credentials", {
        email,
        password: parsed.data.password,
        redirectTo: "/dashboard",
      });
    } catch (e) {
      if (e && typeof e === "object" && "digest" in e && String(e.digest).startsWith("NEXT_REDIRECT")) {
        throw e; // success — let the redirect happen
      }
      throw new Error("An account with that email already exists. Try signing in, or reset your password if you don't remember it.");
    }
    return;
  }

  const now = new Date();
  const existingPending = await db.pendingRegistration.findUnique({ where: { email } });

  // Re-submitting the same signup within the cooldown (double-click, back
  // button) shouldn't send a second email — just continue to the same code.
  if (existingPending && existingPending.lastSentAt.getTime() > now.getTime() - RESEND_COOLDOWN_MS) {
    redirect(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const code = generateOtp();
  const codeExpiresAt = new Date(now.getTime() + CODE_TTL_MS);

  await db.pendingRegistration.upsert({
    where: { email },
    create: { email, name: parsed.data.name, passwordHash, code, codeExpiresAt, lastSentAt: now },
    update: { name: parsed.data.name, passwordHash, code, codeExpiresAt, attempts: 0, lastSentAt: now },
  });

  await sendVerificationEmail(email, parsed.data.name, code);

  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  password: z.string().optional(), // carried client-side only, for auto-sign-in — see verify-email page
});

/**
 * Step 2 of signup. Correct + unexpired + unused code -> creates the real
 * User, deletes the PendingRegistration, and (if the plaintext password was
 * handed forward from the signup form) signs them in immediately. If the
 * password isn't available — e.g. they verified from a different
 * device/session — that's a secure, expected fallback to "please sign in",
 * not an error: the account is still verified either way.
 */
export async function verifyEmail(formData: FormData) {
  const parsed = verifySchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
    password: formData.get("password") || undefined,
  });
  if (!parsed.success) throw new Error("Enter the 6-digit code");

  const email = parsed.data.email.trim().toLowerCase();
  const pending = await db.pendingRegistration.findUnique({ where: { email } });

  if (!pending) {
    throw new Error("We couldn't find a pending signup for that email. Please sign up again.");
  }
  if (pending.codeExpiresAt < new Date()) {
    throw new Error("This code has expired. Request a new one.");
  }
  if (pending.attempts >= MAX_CODE_ATTEMPTS) {
    throw new Error("Too many incorrect attempts. Request a new code.");
  }
  if (pending.code !== parsed.data.code) {
    await db.pendingRegistration.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
    throw new Error("That code doesn't match. Please try again.");
  }

  await db.user.create({
    data: {
      email: pending.email,
      name: pending.name,
      passwordHash: pending.passwordHash,
      emailVerified: new Date(),
    },
  });
  await db.pendingRegistration.delete({ where: { email } });

  if (parsed.data.password) {
    try {
      await signIn("credentials", {
        email,
        password: parsed.data.password,
        redirectTo: "/onboarding",
      });
      return;
    } catch (e) {
      // A redirect() from a successful signIn throws a control-flow error —
      // let that propagate. Anything else, fall through to manual sign-in.
      if (e && typeof e === "object" && "digest" in e && String(e.digest).startsWith("NEXT_REDIRECT")) {
        throw e;
      }
    }
  }

  redirect("/login?verified=1");
}

/** 60-second cooldown, fresh code, previous code invalidated. */
export async function resendVerificationCode(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const pending = await db.pendingRegistration.findUnique({ where: { email: normalizedEmail } });
  if (!pending) throw new Error("No pending signup found for that email.");

  const now = new Date();
  const msSinceLastSend = now.getTime() - pending.lastSentAt.getTime();
  if (msSinceLastSend < RESEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - msSinceLastSend) / 1000);
    throw new Error(`Please wait ${waitSeconds}s before requesting another code.`);
  }

  const code = generateOtp();
  await db.pendingRegistration.update({
    where: { email: normalizedEmail },
    data: { code, codeExpiresAt: new Date(now.getTime() + CODE_TTL_MS), attempts: 0, lastSentAt: now },
  });

  await sendVerificationEmail(normalizedEmail, pending.name, code);
}

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function signInWithCredentials(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });

  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
    throw new Error(`Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`);
  }

  // No verified account yet, but there IS a pending signup with this exact
  // password — this is "you signed up but never verified," not "wrong
  // password," and the UI needs to know which (offers a resend link).
  if (!user) {
    const pending = await db.pendingRegistration.findUnique({ where: { email } });
    if (pending && (await bcrypt.compare(parsed.data.password, pending.passwordHash))) {
      throw new Error("Please verify your email before signing in.");
    }
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      throw new Error("Incorrect email or password.");
    }
    throw e; // rethrow redirect() control-flow errors on success
  }
}
