"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/core/auth/session";
import { handleActionError } from "@/lib/actionError";
import { db } from "@/core/db/client";
import * as engine from "./engine";
import { getPendingCelebrations as getPendingCelebrationsQuery } from "./queries";

/** Client-safe entry point — queries.ts imports Prisma directly. */
export async function getPendingCelebrations() {
  const user = await requireUser();
  return getPendingCelebrationsQuery(user.id);
}

export async function purchasePerk(perkKey: string) {
  try {
    const user = await requireUser();
    const result = await engine.purchasePerk(user.id, perkKey);
    revalidatePath("/rewards/store");
    return result;
  } catch (e) {
    return handleActionError(e);
  }
}

export async function equipPerk(perkKey: string) {
  try {
    const user = await requireUser();
    const result = await engine.equipPerk(user.id, perkKey);
    revalidatePath("/rewards/store");
    revalidatePath("/profile");
    return result;
  } catch (e) {
    return handleActionError(e);
  }
}

export async function unequipPerk(perkKey: string) {
  try {
    const user = await requireUser();
    const result = await engine.unequipPerk(user.id, perkKey);
    revalidatePath("/rewards/store");
    revalidatePath("/profile");
    return result;
  } catch (e) {
    return handleActionError(e);
  }
}

/** Called by the celebration modal once it's finished showing an event. */
export async function markCelebrationSeen(celebrationId: string) {
  try {
    const user = await requireUser();
    await db.celebration.updateMany({ where: { id: celebrationId, userId: user.id }, data: { seen: true } });
  } catch (e) {
    handleActionError(e);
  }
}
