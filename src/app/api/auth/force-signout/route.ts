import { NextResponse } from "next/server";
import { signOut } from "@/core/auth/auth";

/**
 * Clears a "ghost session": a still-valid JWT cookie whose user row no longer
 * exists in the database (e.g. the account was deleted, or a dev DB reset).
 * Server guards redirect here when they detect one — the cookie is wiped and
 * the visitor lands on /login able to sign in fresh.
 */
export async function GET(request: Request) {
  await signOut({ redirect: false });
  return NextResponse.redirect(new URL("/login", request.url));
}
