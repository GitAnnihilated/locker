"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { db } from "@/core/db/client";
import { signIn } from "./auth";
import { requireDbUser } from "./session";

const signUpSchema = z.object({
  name: z.string().min(2, "Enter your full name").max(120),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

/**
 * Email+password sign-up. The name typed here IS the Locker identity from
 * the start — no separate Profile Setup step is needed afterward, unlike the
 * Google flow where the account holder isn't guaranteed to be the student.
 */
export async function signUpWithCredentials(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new Error("An account with that email already exists. Try signing in.");

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await db.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash,
      profileCompletedAt: new Date(),
    },
  });

  await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirectTo: "/dashboard",
  });
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

  try {
    await signIn("credentials", {
      email: parsed.data.email.trim().toLowerCase(),
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

const profileSetupSchema = z.object({
  name: z.string().min(2, "Enter your full name").max(120),
  nickname: z.string().max(60).optional(),
});

/**
 * Completes the one-time Profile Setup gate (see core/auth/session.ts's
 * requireCompleteProfile). This is the ONLY place a Google user's `name` is
 * ever set — deliberately never auto-filled from the Google account, since
 * the account holder isn't guaranteed to be the student.
 */
export async function completeProfileSetup(formData: FormData) {
  const user = await requireDbUser();

  const parsed = profileSetupSchema.safeParse({
    name: formData.get("name"),
    nickname: formData.get("nickname") || undefined,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      nickname: parsed.data.nickname,
      profileCompletedAt: new Date(),
    },
  });

  const hasClass = await db.membership.findFirst({ where: { userId: user.id } });
  redirect(hasClass ? "/dashboard" : "/onboarding");
}
