"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { requireClassFounder, requireClassManager } from "@/core/permissions/guards";
import { generateCode } from "@/lib/ids";
import { handleActionError } from "@/lib/actionError";
import { awardPoints } from "@/core/rewards/engine";
import { GRADE_OPTIONS, SECTION_OPTIONS, composeClassName } from "./classNaming";

/** Join an existing class using its invite code/link — the primary onboarding path. */
export async function joinClassByCode(formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const code = String(formData.get("code") ?? "").trim().toUpperCase();
    if (!code) throw new Error("Enter an invite code");

    const klass = await db.class.findUnique({ where: { inviteCode: code } });
    if (!klass || klass.status !== "ACTIVE") throw new Error("No class found for that code");

    await db.membership.upsert({
      where: { userId_classId: { userId: user.id, classId: klass.id } },
      create: { userId: user.id, classId: klass.id, schoolId: klass.schoolId },
      update: {},
    });

    await awardPoints(user.id, "class_joined", klass.id);
    await awardPoints(user.id, "school_joined", klass.schoolId);

    redirect("/homework");
  } catch (e) {
    return handleActionError(e);
  }
}

const gradeSectionSchema = z.object({
  grade: z.string().refine((v) => GRADE_OPTIONS.includes(v), "Choose a grade"),
  section: z.string().refine((v) => SECTION_OPTIONS.includes(v), "Choose a section"),
});

/**
 * Creates a class inside an ALREADY-CHOSEN school (see src/core/school for
 * search/create-school). The creator instantly becomes the Class Founder —
 * no approval step, so a student's first class is usable in one action.
 * The class name is composed from Grade + Section dropdowns, not typed —
 * see core/membership/classNaming.ts.
 */
export async function createClass(schoolId: string, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const parsed = gradeSectionSchema.safeParse({
      grade: formData.get("grade"),
      section: formData.get("section"),
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid class");

    const name = composeClassName(parsed.data.grade, parsed.data.section);

    // Grade + Section is now a fixed, canonical format (see classNaming.ts), so
    // an exact-name match within the same school IS the same class — no fuzzy
    // matching needed like schools get. Archived/removed classes don't block a
    // fresh one from being created under the same grade/section.
    const duplicate = await db.class.findFirst({
      where: { schoolId, status: "ACTIVE", deletedAt: null, name },
    });
    if (duplicate) {
      throw new Error(`${name} already exists at this school. Ask its Class Founder for an invite code instead of creating a duplicate.`);
    }

    const klass = await db.class.create({
      data: {
        schoolId,
        founderId: user.id,
        name,
        inviteCode: generateCode(6),
      },
    });

    await db.membership.create({
      data: {
        userId: user.id,
        classId: klass.id,
        schoolId,
        role: "FOUNDER",
        verified: true,
      },
    });

    await awardPoints(user.id, "class_joined", klass.id);
    await awardPoints(user.id, "school_joined", schoolId);

    redirect("/homework");
  } catch (e) {
    return handleActionError(e);
  }
}

/**
 * A student can always walk away — leaving never requires anyone's
 * approval. If the leaver is the Class Founder, leadership auto-succeeds to
 * whoever has been in the class longest (earliest join after the founder),
 * so the class is never left ownerless. Only when the founder is the class's
 * last member does leaving require archiving instead (nothing to hand off to).
 */
export async function leaveClass(classId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();

    const membership = await db.membership.findUnique({
      where: { userId_classId: { userId: user.id, classId } },
    });
    if (!membership) return;

    if (membership.role !== "FOUNDER") {
      await db.membership.delete({ where: { id: membership.id } });
      revalidatePath("/dashboard");
      return;
    }

    const successor = await db.membership.findFirst({
      where: { classId, userId: { not: user.id } },
      orderBy: { createdAt: "asc" },
    });

    if (!successor) {
      throw new Error(
        "You're the only member left — archive the class instead of leaving it.",
      );
    }

    await db.$transaction([
      db.class.update({ where: { id: classId }, data: { founderId: successor.userId } }),
      db.membership.update({ where: { id: successor.id }, data: { role: "FOUNDER" } }),
      db.membership.delete({ where: { id: membership.id } }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/class/settings");
  } catch (e) {
    return handleActionError(e);
  }
}

// ---------------------------------------------------------------------------
// Class Founder / Moderator governance
// ---------------------------------------------------------------------------

/** Class Founder only (matches the spec's founder capability list). */
export async function renameClass(classId: string, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireClassFounder(user.id, classId);

    const parsed = gradeSectionSchema.safeParse({
      grade: formData.get("grade"),
      section: formData.get("section"),
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid class");

    await db.class.update({
      where: { id: classId },
      data: { name: composeClassName(parsed.data.grade, parsed.data.section) },
    });
    revalidatePath("/class/settings");
  } catch (e) {
    return handleActionError(e);
  }
}

/** Class Founder or Moderator — rotates the code so old links stop working. */
export async function regenerateInviteCode(classId: string): Promise<{ error: string } | string> {
  try {
    const user = await requireUser();
    await requireClassManager(user.id, classId);

    const inviteCode = generateCode(6);
    await db.class.update({ where: { id: classId }, data: { inviteCode } });
    revalidatePath("/class/settings");
    revalidatePath("/dashboard");
    return inviteCode;
  } catch (e) {
    return handleActionError(e);
  }
}

/** Class Founder or Moderator — removes a spammy/inactive member. */
export async function removeMember(classId: string, targetUserId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const ctx = await requireClassManager(user.id, classId);

    if (targetUserId === ctx.founderId) {
      throw new Error("The class founder can't be removed. Transfer ownership first.");
    }

    await db.membership.deleteMany({ where: { classId, userId: targetUserId } });
    revalidatePath("/class/settings");
  } catch (e) {
    return handleActionError(e);
  }
}

/** Class Founder only — grants moderation power to a member. */
export async function promoteModerator(classId: string, targetUserId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireClassFounder(user.id, classId);

    await db.membership.updateMany({
      where: { classId, userId: targetUserId },
      data: { role: "MODERATOR" },
    });
    revalidatePath("/class/settings");
  } catch (e) {
    return handleActionError(e);
  }
}

/** Class Founder only — revokes moderation power. */
export async function demoteModerator(classId: string, targetUserId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireClassFounder(user.id, classId);

    await db.membership.updateMany({
      where: { classId, userId: targetUserId, role: "MODERATOR" },
      data: { role: "STUDENT" },
    });
    revalidatePath("/class/settings");
  } catch (e) {
    return handleActionError(e);
  }
}

/** Class Founder only — hides the class without deleting its history. */
export async function archiveClass(classId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireClassFounder(user.id, classId);

    await db.class.update({ where: { id: classId }, data: { status: "ARCHIVED" } });
    revalidatePath("/class/settings");
    revalidatePath("/dashboard");
  } catch (e) {
    return handleActionError(e);
  }
}

/** Class Founder only — hands the class to another member. */
export async function transferClassOwnership(classId: string, targetUserId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireClassFounder(user.id, classId);

    const targetMembership = await db.membership.findUnique({
      where: { userId_classId: { userId: targetUserId, classId } },
    });
    if (!targetMembership) throw new Error("New owner must already be a class member");

    await db.$transaction([
      db.class.update({ where: { id: classId }, data: { founderId: targetUserId } }),
      db.membership.update({
        where: { userId_classId: { userId: targetUserId, classId } },
        data: { role: "FOUNDER" },
      }),
      db.membership.update({
        where: { userId_classId: { userId: user.id, classId } },
        data: { role: "STUDENT" },
      }),
    ]);

    revalidatePath("/class/settings");
  } catch (e) {
    return handleActionError(e);
  }
}
