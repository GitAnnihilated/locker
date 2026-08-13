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
  requireSchoolStaff,
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
 * SCHOOL: gated to TEACHER/PRINCIPAL (requireTeacherOrPrincipal) AND to
 * already being staff of THIS school (requireSchoolStaff) — a teacher
 * can't create a class in a school they haven't joined with their
 * Principal's staff code, even if they can find it in search. The name is
 * composed from Grade + Section dropdowns, not typed. There's no "subject"
 * on the class itself anymore — see ClassTeacher: the creator picks the
 * subject THEY teach here, exactly the same way a second teacher joining
 * this same class later would (see joinClassAsTeacher). COLLEGE keeps the
 * original student-first, no-gatekeeping model — a Class doubles as a
 * Course (see EducationType/Class.courseCode), taking a free-text course
 * name + optional code instead. Which branch runs (and which gates apply)
 * is decided from the caller's own DB row, never a client-supplied flag.
 */
export async function createClass(schoolId: string, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { educationType: true } });
    const isCollege = dbUser?.educationType === "COLLEGE";

    let name: string;
    let courseCode: string | null = null;
    let mySubject: string | null = null;

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
      await requireSchoolStaff(user.id, schoolId);
      const parsed = gradeSectionSchema.safeParse({
        grade: formData.get("grade"),
        section: formData.get("section"),
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid class");
      const parsedSubject = subjectSchema.safeParse(formData.get("subject"));
      if (!parsedSubject.success) throw new Error(parsedSubject.error.issues[0]?.message ?? "Enter the subject you teach");
      name = composeClassName(parsed.data.grade, parsed.data.section);
      mySubject = parsedSubject.data;
    }

    // Exact-name match within the same school is the same class/course —
    // no fuzzy matching needed like schools get. Archived/removed classes
    // don't block a fresh one from being created under the same name.
    const duplicate = await db.class.findFirst({
      where: { schoolId, status: "ACTIVE", deletedAt: null, name },
    });
    if (duplicate) {
      throw new Error(
        isCollege
          ? `"${name}" already exists here. Ask its Course Founder for an invite code instead of creating a duplicate.`
          : `"${name}" already exists here — join it as a teacher instead of creating a duplicate.`,
      );
    }

    const klass = await db.class.create({
      data: {
        schoolId,
        founderId: user.id,
        teacherId: isCollege ? null : user.id,
        name,
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

    if (!isCollege && mySubject) {
      await db.classTeacher.create({
        data: { classId: klass.id, teacherId: user.id, subject: mySubject },
      });
    }

    await awardPoints(user.id, "class_joined", klass.id);
    await awardPoints(user.id, "school_joined", schoolId);

    redirect(isCollege ? "/dashboard" : "/homework");
  } catch (e) {
    return handleActionError(e);
  }
}

/**
 * A teacher joins an EXISTING class in a school they're already staff of
 * (requireSchoolStaff) — the actual "join any class in their school"
 * feature. Creates the same ClassTeacher row createClass makes for its
 * creator, plus a Membership (role TEACHER, not FOUNDER) so the joined
 * class shows up for them everywhere a normal membership does (Homework
 * board, getActiveMembership, etc.) without touching class governance.
 */
export async function joinClassAsTeacher(classId: string, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireTeacherOrPrincipal(user.id);

    const klass = await db.class.findUniqueOrThrow({ where: { id: classId }, select: { schoolId: true, teacherId: true } });
    if (!klass.teacherId) throw new Error("This isn't a school class.");
    await requireSchoolStaff(user.id, klass.schoolId);

    const parsedSubject = subjectSchema.safeParse(formData.get("subject"));
    if (!parsedSubject.success) throw new Error(parsedSubject.error.issues[0]?.message ?? "Enter the subject you teach");

    const already = await db.classTeacher.findUnique({
      where: { classId_teacherId: { classId, teacherId: user.id } },
    });
    if (already) throw new Error("You're already teaching this class.");

    await db.$transaction([
      db.classTeacher.create({ data: { classId, teacherId: user.id, subject: parsedSubject.data } }),
      db.membership.upsert({
        where: { userId_classId: { userId: user.id, classId } },
        create: { userId: user.id, classId, schoolId: klass.schoolId, role: "TEACHER", verified: true },
        update: {},
      }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/classes");
  } catch (e) {
    return handleActionError(e);
  }
}

/**
 * A student can always walk away — leaving never requires anyone's
 * approval. COLLEGE keeps the original student-first model: if the leaver
 * is the Course Founder, leadership auto-succeeds to whoever's been there
 * longest, so the course is never left ownerless.
 *
 * SCHOOL is different on purpose: a class's teacher is not a peer who
 * happens to be first among equals, they're its actual teacher-of-record
 * (Class.teacherId). Handing that off to a student on leave would silently
 * turn a teacher-owned class into a student-owned one — exactly the thing
 * role gating exists to prevent. A teacher can still archive their own
 * class; they just can't "leave" it into a student's hands.
 */
export async function leaveClass(classId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();

    const [membership, klass] = await Promise.all([
      db.membership.findUnique({ where: { userId_classId: { userId: user.id, classId } } }),
      db.class.findUniqueOrThrow({ where: { id: classId }, select: { teacherId: true } }),
    ]);
    if (!membership) return;

    if (membership.role !== "FOUNDER") {
      await db.membership.delete({ where: { id: membership.id } });
      revalidatePath("/dashboard");
      return;
    }

    if (klass.teacherId) {
      throw new Error(
        "As this class's teacher, you can archive it from Class Settings, but you can't hand it off to a student by leaving.",
      );
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
// Class governance — SCHOOL classes are teacher-owned (Class.teacherId is
// fixed at creation); COLLEGE courses keep the original student-founder/
// moderator model. Every action below that only makes sense in one of the
// two says so explicitly.
// ---------------------------------------------------------------------------

/** Class Founder/Teacher, or the school authority above them. */
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
      const klass = await db.class.findUniqueOrThrow({ where: { id: classId }, select: { teacherId: true } });
      throw new Error(
        klass.teacherId ? "This class's teacher can't be removed." : "The class founder can't be removed. Transfer ownership first.",
      );
    }

    // A removed co-teacher's ClassTeacher row would otherwise linger and
    // keep this class showing up in their "My classes"/PTM/roster lists.
    await db.$transaction([
      db.membership.deleteMany({ where: { classId, userId: targetUserId } }),
      db.classTeacher.deleteMany({ where: { classId, teacherId: targetUserId } }),
    ]);
    revalidatePath("/class/settings");
  } catch (e) {
    return handleActionError(e);
  }
}

/**
 * COLLEGE only — a peer-promoted moderator makes sense in the student-first
 * course model. SCHOOL classes are teacher-owned (Class.teacherId); there's
 * no "promote a student to help govern" step, since governance authority
 * comes from the User.role a Principal/Teacher already holds, not a class-
 * scoped grant. See requireTeacherOrPrincipal for how that's enforced.
 */
export async function promoteModerator(classId: string, targetUserId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireClassGovernor(user.id, classId);

    const klass = await db.class.findUniqueOrThrow({ where: { id: classId }, select: { teacherId: true } });
    if (klass.teacherId) throw new Error("School classes don't have moderators — the teacher manages the class directly.");

    await db.membership.updateMany({
      where: { classId, userId: targetUserId },
      data: { role: "MODERATOR" },
    });
    revalidatePath("/class/settings");
  } catch (e) {
    return handleActionError(e);
  }
}

/** COLLEGE only — see promoteModerator. */
export async function demoteModerator(classId: string, targetUserId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireClassGovernor(user.id, classId);

    const klass = await db.class.findUniqueOrThrow({ where: { id: classId }, select: { teacherId: true } });
    if (klass.teacherId) throw new Error("School classes don't have moderators — the teacher manages the class directly.");

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
 * COLLEGE only — hands the course to another member. Demotes the OUTGOING
 * founder (ctx.founderId), not necessarily the caller — a school authority
 * invoking this from School Settings usually isn't a member of the course
 * at all. SCHOOL classes can't be transferred this way — see requireTeacherOrPrincipal
 * (only a Teacher/Principal ever creates one) and Class.teacherId, which is
 * the fixed owner, not something a member vote or hand-off can move.
 */
export async function transferClassOwnership(classId: string, targetUserId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const ctx = await requireClassGovernor(user.id, classId);

    const klass = await db.class.findUniqueOrThrow({ where: { id: classId }, select: { teacherId: true } });
    if (klass.teacherId) throw new Error("A school class's teacher is fixed and can't be transferred to a student.");

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
