"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { requireTeacherOrPrincipal, requireSchoolStaff, requireClassTeacher } from "@/core/permissions/guards";
import { handleActionError } from "@/lib/actionError";

const groupSchema = z.object({
  name: z.string().trim().min(2, "Name this group").max(80),
  classIds: z.array(z.string()).min(2, "Pick at least 2 classes to group"),
});

/**
 * Bundles several classes the caller actually teaches into one named
 * "compound class" (e.g. every section of Grade 10 they teach Math to).
 * Every classId must be one the caller has a ClassTeacher row for — you
 * can only group classes you teach, never someone else's.
 */
export async function createClassGroup(schoolId: string, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireTeacherOrPrincipal(user.id);
    await requireSchoolStaff(user.id, schoolId);

    const parsed = groupSchema.safeParse({
      name: formData.get("name"),
      classIds: formData.getAll("classIds"),
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid group");

    // Every class must (a) belong to this school and (b) actually be taught
    // by the caller — re-checked here, never trusted from the submitted list.
    await Promise.all(parsed.data.classIds.map((classId) => requireClassTeacher(user.id, classId)));
    const classes = await db.class.findMany({
      where: { id: { in: parsed.data.classIds }, schoolId },
      select: { id: true },
    });
    if (classes.length !== parsed.data.classIds.length) {
      throw new Error("All classes in a group must belong to the same school.");
    }

    await db.classGroup.create({
      data: {
        schoolId,
        name: parsed.data.name,
        createdById: user.id,
        members: { create: parsed.data.classIds.map((classId) => ({ classId })) },
      },
    });

    revalidatePath("/classes");
  } catch (e) {
    return handleActionError(e);
  }
}

/** Only the group's creator can take it apart — this never deletes the underlying classes. */
export async function deleteClassGroup(groupId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const group = await db.classGroup.findUniqueOrThrow({ where: { id: groupId } });
    if (group.createdById !== user.id) throw new Error("Only this group's creator can delete it.");

    // No cascade delete in this schema (see other models) — clear the
    // member rows first or the group row's FK reference blocks the delete.
    await db.$transaction([
      db.classGroupMember.deleteMany({ where: { groupId } }),
      db.classGroup.delete({ where: { id: groupId } }),
    ]);
    revalidatePath("/classes");
  } catch (e) {
    return handleActionError(e);
  }
}
