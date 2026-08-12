"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { handleActionError } from "@/lib/actionError";

const taskSchema = z.object({
  title: z.string().trim().min(1, "Enter a task").max(200),
  dueAt: z.string().optional(),
});

/**
 * Ad hoc "things people asked me to do" — deliberately private and
 * generic, not a duty roster or coordinator workflow (that stays the
 * school's existing ERP). Any user can keep one; there's no role check
 * because a personal task list needs none.
 */
export async function createTask(formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const parsed = taskSchema.safeParse({
      title: formData.get("title"),
      dueAt: formData.get("dueAt") || undefined,
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid task");

    await db.personalTask.create({
      data: {
        userId: user.id,
        title: parsed.data.title,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      },
    });
    revalidatePath("/tasks");
  } catch (e) {
    return handleActionError(e);
  }
}

export async function toggleTask(taskId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const task = await db.personalTask.findUniqueOrThrow({ where: { id: taskId } });
    if (task.userId !== user.id) throw new Error("Not your task");

    await db.personalTask.update({
      where: { id: taskId },
      data: { done: !task.done, completedAt: !task.done ? new Date() : null },
    });
    revalidatePath("/tasks");
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteTask(taskId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await db.personalTask.deleteMany({ where: { id: taskId, userId: user.id } });
    revalidatePath("/tasks");
  } catch (e) {
    return handleActionError(e);
  }
}
