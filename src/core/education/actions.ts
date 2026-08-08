"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { handleActionError } from "@/lib/actionError";
import type { EducationType } from "@prisma/client";

const VALID_TYPES: EducationType[] = ["SCHOOL", "COLLEGE"];

/**
 * The ONLY place a user's educationType is ever written — always keyed off
 * the authenticated session (requireUser), never a client-supplied user id.
 * `type` itself is just the user's own form choice (like any other input);
 * what matters is that every read of educationType elsewhere in the app
 * comes fresh from the DB via requireDbUser(), never trusted from a client
 * param, so this write is the only way it can ever change.
 *
 * Used both by onboarding (first-time choice) and Settings (switching
 * later) — switching is explicitly NOT a destructive migration: it only
 * ever updates this one column. No School/Class/Homework/Group/etc. rows
 * are touched, so no data from either experience is ever at risk.
 */
export async function setEducationType(type: EducationType): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    if (!VALID_TYPES.includes(type)) throw new Error("Invalid education type");

    await db.user.update({
      where: { id: user.id },
      data: { educationType: type, educationTypeSetAt: new Date() },
    });

    // Nav, dashboard, and module list are all keyed off educationType and
    // live across many routes — revalidate broadly rather than trying to
    // enumerate every affected path.
    revalidatePath("/", "layout");
  } catch (e) {
    return handleActionError(e);
  }
}
