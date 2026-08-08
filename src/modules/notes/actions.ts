"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { handleActionError } from "@/lib/actionError";
import { awardPoints } from "@/core/rewards/engine";
import { resourceSchema } from "@/modules/groups/schema";

/** Any course member can share a resource — same "contribution, not governance" stance as Group resources. */
async function requireCourseMembership(classId: string, userId: string) {
  const membership = await db.membership.findUnique({ where: { userId_classId: { userId, classId } } });
  if (!membership) throw new Error("You're not enrolled in this course.");
  return membership;
}

export async function addClassResource(classId: string, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireCourseMembership(classId, user.id);

    const parsed = resourceSchema.safeParse({
      title: formData.get("title"),
      type: formData.get("type"),
      url: formData.get("url"),
      description: formData.get("description") || undefined,
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid resource");

    const resource = await db.classResource.create({
      data: {
        classId,
        title: parsed.data.title,
        type: parsed.data.type,
        url: parsed.data.url,
        description: parsed.data.description,
        uploaderId: user.id,
      },
    });

    // Reuses the exact same point-earning action as Group resources —
    // "shared a useful resource" means the same thing either way.
    await awardPoints(user.id, "resource_uploaded", resource.id);

    revalidatePath(`/courses/${classId}`);
    revalidatePath("/notes");
  } catch (e) {
    return handleActionError(e);
  }
}

export async function removeClassResource(resourceId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const resource = await db.classResource.findUnique({ where: { id: resourceId } });
    if (!resource) return;

    if (resource.uploaderId !== user.id) {
      throw new Error("Only the person who shared it can remove it.");
    }

    await db.classResource.update({ where: { id: resourceId }, data: { deletedAt: new Date() } });
    revalidatePath(`/courses/${resource.classId}`);
    revalidatePath("/notes");
  } catch (e) {
    return handleActionError(e);
  }
}
