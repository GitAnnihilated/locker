"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { requireTeacherOfStudent, requireClassTeacher } from "@/core/permissions/guards";
import { handleActionError } from "@/lib/actionError";

const noteSchema = z.object({
  category: z.enum(["BEHAVIOR", "PARTICIPATION", "HOMEWORK", "ACHIEVEMENT", "GENERAL"]),
  content: z.string().trim().min(1, "Write something first").max(1000),
});

/**
 * Logs a quick observation about a student — the whole point is that this
 * takes a few seconds, not a form to dread. Only the student's actual
 * class teacher can write one, and only about a student genuinely in
 * that class (requireTeacherOfStudent checks both).
 */
export async function addStudentNote(classId: string, studentId: string, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireTeacherOfStudent(user.id, studentId, classId);

    const parsed = noteSchema.safeParse({
      category: formData.get("category"),
      content: formData.get("content"),
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid note");

    await db.studentNote.create({
      data: { classId, studentId, authorId: user.id, category: parsed.data.category, content: parsed.data.content },
    });

    revalidatePath(`/students/${classId}/${studentId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

/** Soft-delete — only the teacher who wrote it can retract it. */
export async function deleteStudentNote(noteId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const note = await db.studentNote.findUniqueOrThrow({ where: { id: noteId } });
    await requireClassTeacher(user.id, note.classId);
    if (note.authorId !== user.id) throw new Error("Only the teacher who wrote this note can remove it.");

    await db.studentNote.update({ where: { id: noteId }, data: { deletedAt: new Date() } });
    revalidatePath(`/students/${note.classId}/${note.studentId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

/**
 * Achievement verification — wires up Achievement.verificationStatus,
 * which has existed in the schema since the Achievements module shipped
 * but had no verifier until now. A teacher can only verify/reject an
 * achievement belonging to a student in one of their own classes.
 */
export async function verifyAchievement(achievementId: string, classId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const achievement = await db.achievement.findUniqueOrThrow({ where: { id: achievementId } });
    await requireTeacherOfStudent(user.id, achievement.userId, classId);

    await db.achievement.update({ where: { id: achievementId }, data: { verificationStatus: "VERIFIED" } });
    revalidatePath(`/students/${classId}/${achievement.userId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function rejectAchievement(achievementId: string, classId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const achievement = await db.achievement.findUniqueOrThrow({ where: { id: achievementId } });
    await requireTeacherOfStudent(user.id, achievement.userId, classId);

    await db.achievement.update({ where: { id: achievementId }, data: { verificationStatus: "REJECTED" } });
    revalidatePath(`/students/${classId}/${achievement.userId}`);
  } catch (e) {
    return handleActionError(e);
  }
}
