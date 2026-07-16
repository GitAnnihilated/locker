"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { getActiveMembership } from "@/core/membership/queries";
import { requireClassManager } from "@/core/permissions/guards";
import { handleActionError } from "@/lib/actionError";
import { awardPoints } from "@/core/rewards/engine";
import { createHomeworkSchema } from "./schema";

/**
 * Server Actions are the single mutation path for this module. They validate,
 * authorize (must be a member of the class), write, and revalidate the board.
 */

export async function createHomework(formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const membership = await getActiveMembership(user.id);
    if (!membership) throw new Error("Join a class first");

    const parsed = createHomeworkSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      subject: formData.get("subject") || undefined,
      dueAt: formData.get("dueAt") || undefined,
    });
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    await db.homework.create({
      data: {
        classId: membership.classId,
        authorId: user.id, // first author gets contribution credit
        title: parsed.data.title,
        description: parsed.data.description,
        subject: parsed.data.subject,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      },
    });

    revalidatePath("/homework");
  } catch (e) {
    return handleActionError(e);
  }
}

/** Toggle personal done state — the daily engagement signal. */
export async function toggleDone(homeworkId: string, done: boolean): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();

    await db.homeworkStatus.upsert({
      where: { homeworkId_userId: { homeworkId, userId: user.id } },
      create: { homeworkId, userId: user.id, done, doneAt: done ? new Date() : null },
      update: { done, doneAt: done ? new Date() : null },
    });

    if (done) await awardPoints(user.id, "homework_completed", homeworkId);

    revalidatePath("/homework");
  } catch (e) {
    return handleActionError(e);
  }
}

/** Confirm an assignment is real — feeds the coverage meter. Must be a member of that specific class. */
export async function confirmHomework(homeworkId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const homework = await db.homework.findUnique({
      where: { id: homeworkId },
      select: { classId: true },
    });
    if (!homework) return;

    const membership = await db.membership.findUnique({
      where: { userId_classId: { userId: user.id, classId: homework.classId } },
    });
    if (!membership) throw new Error("You're not a member of this class");

    await db.homework.update({
      where: { id: homeworkId },
      data: { confirmations: { increment: 1 } },
    });
    revalidatePath("/homework");
  } catch (e) {
    return handleActionError(e);
  }
}

/**
 * Class Founder or Moderator only — the actual fix for "a random member
 * joins and spams the board": there was previously no way to take a bad
 * entry down. Soft-deleted, not hard-deleted, matching every other module's
 * moderation pattern (recoverable, auditable).
 */
export async function removeHomework(homeworkId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const homework = await db.homework.findUnique({
      where: { id: homeworkId },
      select: { classId: true },
    });
    if (!homework) return;

    await requireClassManager(user.id, homework.classId);

    await db.homework.update({
      where: { id: homeworkId },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/homework");
  } catch (e) {
    return handleActionError(e);
  }
}
