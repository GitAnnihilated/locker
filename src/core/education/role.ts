"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { handleActionError } from "@/lib/actionError";
import type { UserRole } from "@prisma/client";

const VALID_ROLES: UserRole[] = ["STUDENT", "TEACHER", "PRINCIPAL"];

/**
 * The ONLY place a user's global role is ever written — always keyed off the
 * authenticated session (requireUser), same pattern as setEducationType in
 * ./actions.ts. This is a one-time onboarding choice (see roleSetAt), not a
 * per-class thing — every authorization check elsewhere (requirePrincipal,
 * requireTeacherOrPrincipal) reads this column fresh from the DB, never a
 * client-supplied value.
 */
export async function setUserRole(role: UserRole): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    if (!VALID_ROLES.includes(role)) throw new Error("Invalid role");

    await db.user.update({
      where: { id: user.id },
      data: { role, roleSetAt: new Date() },
    });

    revalidatePath("/", "layout");
  } catch (e) {
    return handleActionError(e);
  }
}
