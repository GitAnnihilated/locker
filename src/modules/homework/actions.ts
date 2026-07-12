"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { getActiveMembership } from "@/core/membership/queries";
import { createHomeworkSchema } from "./schema";

/**
 * Server Actions are the single mutation path for this module. They validate,
 * authorize (must be a member of the class), write, and revalidate the board.
 */

export async function createHomework(formData: FormData) {
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
}

/** Toggle personal done state — the daily engagement signal. */
export async function toggleDone(homeworkId: string, done: boolean) {
  const user = await requireUser();

  await db.homeworkStatus.upsert({
    where: { homeworkId_userId: { homeworkId, userId: user.id } },
    create: { homeworkId, userId: user.id, done, doneAt: done ? new Date() : null },
    update: { done, doneAt: done ? new Date() : null },
  });

  revalidatePath("/homework");
}

/** Confirm an assignment is real — feeds the coverage meter. */
export async function confirmHomework(homeworkId: string) {
  await requireUser();
  await db.homework.update({
    where: { id: homeworkId },
    data: { confirmations: { increment: 1 } },
  });
  revalidatePath("/homework");
}
