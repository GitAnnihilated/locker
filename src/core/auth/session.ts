import { redirect } from "next/navigation";
import { auth } from "./auth";
import { db } from "@/core/db/client";

/** Server-side guard: returns the current session user or bounces to /login. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Server-side guard: requires a session AND a matching User row in the
 * database. Sessions are JWTs, so a cookie can outlive its user (account
 * deleted, dev DB reset) — a "ghost session". Detecting that here and
 * force-clearing the cookie lets the app self-heal instead of trapping the
 * visitor in a loop where every page half-recognizes them.
 */
export async function requireDbUser() {
  const sessionUser = await requireUser();
  const dbUser = await db.user.findUnique({ where: { id: sessionUser.id } });
  if (!dbUser) redirect("/api/auth/force-signout");
  return dbUser;
}

/**
 * Server-side guard: requires a session AND a completed profile (a real
 * name the user entered themselves). Used by the authenticated app shell so
 * nobody reaches the dashboard under an unreviewed Google display name.
 * /profile/setup itself uses requireDbUser() only, to avoid a redirect loop.
 */
export async function requireCompleteProfile() {
  const dbUser = await requireDbUser();
  if (!dbUser.profileCompletedAt) redirect("/profile/setup");
  return dbUser;
}
