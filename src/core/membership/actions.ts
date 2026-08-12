"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import {
  requireClassGovernor,
  requireClassManagerOrSchoolAuthority,
  requireTeacherOrPrincipal,
} from "@/core/permissions/guards";
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

    redirect(await postJoinRedirect(user.id));
  } catch (e) {
    return handleActionError(e);
  }
}

const gradeSectionSchema = z.object({
  grade: z.string().refine((v) => GRADE_OPTIONS.includes(v), "Choose a grade"),
  section: z.string().refine((v) => SECTION_OPTIONS.includes(v), "Choose a section"),
});

// Subject is required at creation time (a teacher always teaches a specific
// subject) but stays a separate, optional-on-parse concern from
// gradeSectionSchema so renameClass — which never touches subject — doesn't
// need to invent a value just to satisfy this schema.
const subjectSchema = z.string().trim().min(1, "Enter a subject").max(60);

const courseSchema = z.object({
  name: z.string().trim().min(2, "Enter a course name").max(80),
  courseCode: z.string().trim().max(20).optional(),
});

/** Where onboarding lands a student right after they get their first class — the
 * School homework board, or the College dashboard (no single "board" for a
 * multi-course student to land on). Read fresh from the DB, never trusted
 * from the client, same as every other educationType-gated decision. */
async function postJoinRedirect(userId: string): Promise<string> {
  const dbUser = await db.user.findUnique({ where: { id: userId }, select: { educationType: true } });
  return dbUser?.educationType === "COLLEGE" ? "/dashboard" : "/homework";
}

/**
 * Creates a class inside an ALREADY-CHOSEN school (see src/core/school for
 * search/create-school). The creator becomes the Class Founder AND
 * Class.teacherId (for SCHOOL) — no separate "claim" step, so a teacher's
 * first class is usable in one action.
 *
 * SCHOOL: gated to TEACHER/PRINCIPAL (see requireTeacherOrPrincipal) — a
 * student can join a class but never create one. The name is composed from
 * Grade + Section dropdowns, not typed, plus a required subject — see
 * core/membership/classNaming.ts. COLLEGE: keeps the original student-first,
 * no-gatekeeping model — a Class doubles as a Course (see EducationType/
 * Class.courseCode), taking a free-text course name + optional code instead.
 * Which branch runs (and which role gate applies) is decided from the
 * caller's own DB row, never a client-supplied flag.
 */
export async function createClass(schoolId: string, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { educationType: true } });
    const isCollege = dbUser?.educationType === "COLLEGE";

    let name: string;
    let courseCode: string | null = null;
    let subject: string | null = null;

    if (isCollege) {
      const parsed = courseSchema.safeParse({
        name: formData.get("name"),
        courseCode: formData.get("courseCode") || undefined,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid course");
      name = parsed.data.name;
      courseCode = parsed.data.courseCode?.toUpperCase() || null;
    } else {
      await requireTeacherOrPrincipal(user.id);
      const parsed = gradeSectionSchema.safeParse({
        grade: formData.get("grade"),
        section: formData.get("section"),
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid class");
      const parsedSubject = subjectSchema.safeParse(formData.get("subject"));
      if (!parsedSubject.success) throw new Error(parsedSubject.error.issues[0]?.message ?? "Enter a subject");
      name = composeClassName(parsed.data.grade, parsed.data.section);
      subject = parsedSubject.data;
    }

    // Exact-name match within the same school is the same class/course —
    // no fuzzy matching needed like schools get. Archived/removed classes
    // don't block a fresh one from being created under the same name.
    const duplicate = await db.class.findFirst({
      where: { schoolId, status: "ACTIVE", deletedAt: null, name },
    });
    if (duplicate) {
      throw new Error(
        `"${name}" already exists here. Ask its ${isCollege ? "Course" : "Class"} Founder for an invite code instead of creating a duplicate.`,
      );
    }

    const klass = await db.class.create({
      data: {
        schoolId,
        founderId: user.id,
        teacherId: isCollege ? null : user.id,
        name,
        subject,
        courseCode,
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

    redirect(isCollege ? "/dashboard" : "/homework");
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

/** Class Founder, or the School Founder of this class's school. */
export async function renameClass(classId: string, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireClassGovernor(user.id, classId);

    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { educationType: true } });

    if (dbUser?.educationType === "COLLEGE") {
      const parsed = courseSchema.safeParse({
        name: formData.get("name"),
        courseCode: formData.get("courseCode") || undefined,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid course");
      await db.class.update({
        where: { id: classId },
        data: { name: parsed.data.name, courseCode: parsed.data.courseCode?.toUpperCase() || null },
      });
    } else {
      const parsed = gradeSectionSchema.safeParse({
        grade: formData.get("grade"),
        section: formData.get("section"),
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid class");
      await db.class.update({
        where: { id: classId },
        data: { name: composeClassName(parsed.data.grade, parsed.data.section) },
      });
    }

    revalidatePath("/class/settings");
  } catch (e) {
    return handleActionError(e);
  }
}

/** Class Founder/Moderator, or School Founder/Moderator — rotates the code so old links stop working. */
export async function regenerateInviteCode(classId: string): Promise<{ error: string } | string> {
  try {
    const user = await requireUser();
    await requireClassManagerOrSchoolAuthority(user.id, classId);

    const inviteCode = generateCode(6);
    await db.class.update({ where: { id: classId }, data: { inviteCode } });
    revalidatePath("/class/settings");
    revalidatePath("/dashboard");
    return inviteCode;
  } catch (e) {
    return handleActionError(e);
  }
}

/** Class Founder/Moderator, or School Founder/Moderator — removes a spammy/inactive member. */
export async function removeMember(classId: string, targetUserId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const ctx = await requireClassManagerOrSchoolAuthority(user.id, classId);

    if (targetUserId === ctx.founderId) {
      throw new Error("The class founder can't be removed. Transfer ownership first.");
    }

    await db.membership.deleteMany({ where: { classId, userId: targetUserId } });
    revalidatePath("/class/settings");
  } catch (e) {
    return handleActionError(e);
  }
}

/** Class Founder, or School Founder — grants moderation power to a member. */
export async function promoteModerator(classId: string, targetUserId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireClassGovernor(user.id, classId);

    await db.membership.updateMany({
      where: { classId, userId: targetUserId },
      data: { role: "MODERATOR" },
    });
    revalidatePath("/class/settings");
  } catch (e) {
    return handleActionError(e);
  }
}

/** Class Founder, or School Founder — revokes moderation power. */
export async function demoteModerator(classId: string, targetUserId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireClassGovernor(user.id, classId);

    await db.membership.updateMany({
      where: { classId, userId: targetUserId, role: "MODERATOR" },
      data: { role: "STUDENT" },
    });
    revalidatePath("/class/settings");
  } catch (e) {
    return handleActionError(e);
  }
}

/** Class Founder, or School Founder — hides the class without deleting its history. */
export async function archiveClass(classId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireClassGovernor(user.id, classId);

    await db.class.update({ where: { id: classId }, data: { status: "ARCHIVED" } });
    revalidatePath("/class/settings");
    revalidatePath("/dashboard");
  } catch (e) {
    return handleActionError(e);
  }
}

/**
 * Class Founder, or School Founder — hands the class to another member.
 * Demotes the OUTGOING class founder (ctx.founderId), not necessarily the
 * caller — a School Founder invoking this from School Settings usually
 * isn't a member of the class at all.
 */
export async function transferClassOwnership(classId: string, targetUserId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const ctx = await requireClassGovernor(user.id, classId);

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
        where: { userId_classId: { userId: ctx.founderId, classId } },
        data: { role: "STUDENT" },
      }),
    ]);

    revalidatePath("/class/settings");
    revalidatePath("/school/settings");
  } catch (e) {
    return handleActionError(e);
  }
}
