"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { requireSchoolFounder, requireSchoolModerator, requirePrincipal, requireTeacherOrPrincipal } from "@/core/permissions/guards";
import { generateCode } from "@/lib/ids";
import { normalizeSchoolName, nameSimilarity } from "@/lib/similarity";
import { handleActionError } from "@/lib/actionError";
import type { SchoolSearchResult } from "./queries";

/**
 * Exposed as a Server Action (not a plain query) specifically so the client
 * SchoolSearch component can call it directly without an API route — Server
 * Actions are the only server functions safely importable from "use client".
 */
export async function searchSchools(query: string): Promise<SchoolSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const schools = await db.school.findMany({
    where: { deletedAt: null, name: { contains: q, mode: "insensitive" } },
    take: 10,
    orderBy: { name: "asc" },
    include: { _count: { select: { classes: true } } },
  });

  return schools.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    classCount: s._count.classes,
  }));
}

/**
 * Fuzzy near-duplicate check, meant to run BEFORE the student commits to
 * creating a school — "did you mean one of these?" — so typos and minor
 * name variations ("Lincoln High" vs "Lincoln High School") don't fragment
 * one real school into several Locker schools. Advisory, not a hard block:
 * the student can still proceed to create if none of these are actually it.
 */
export async function findSimilarSchools(name: string): Promise<SchoolSearchResult[]> {
  const trimmed = name.trim();
  if (trimmed.length < 3) return [];

  // Narrow the candidate set with a cheap ILIKE on the first word before
  // scoring in JS — see lib/similarity.ts for the scale note.
  const firstWord = trimmed.split(/\s+/)[0];
  const candidates = await db.school.findMany({
    where: { deletedAt: null, name: { contains: firstWord, mode: "insensitive" } },
    take: 30,
    include: { _count: { select: { classes: true } } },
  });

  return candidates
    .map((s) => ({ school: s, score: nameSimilarity(s.name, trimmed) }))
    .filter((x) => x.score >= 0.55)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ school: s }) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      classCount: s._count.classes,
    }));
}

const createSchoolSchema = z.object({ name: z.string().min(2).max(120) });

/**
 * SCHOOL: gated to the PRINCIPAL/IT Admin role — a school is a real
 * institution, and only its Principal/IT Admin creates/owns it (see
 * src/core/permissions/guards.ts requirePrincipal) — AND behind a paywall:
 * Locker is $85/month per school, and this is a deliberately dummy
 * paywall with no real payment processing wired up yet. Nobody gets past
 * it without SCHOOL_CREATION_DEV_CODE, checked server-side here, never
 * trusted from anything the client claims. COLLEGE keeps the original
 * no-gatekeeping, no-paywall model — the first student to look for their
 * college and not find it just creates it, since there's no
 * Principal-equivalent role or pricing story for College accounts.
 *
 * Still hard-blocks an EXACT normalized duplicate ("Lincoln High School" vs
 * "lincoln   high  school!!") — that's not a judgment call the creator needs
 * to make, it's the same school. Near-duplicates are caught earlier by
 * findSimilarSchools as an advisory "did you mean" prompt instead, since
 * only a human can tell two similarly-named schools apart.
 */
export async function createSchool(
  formData: FormData,
): Promise<{ error: string } | { id: string; name: string; slug: string }> {
  try {
    const user = await requireUser();
    const dbUser = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { educationType: true } });
    if (dbUser.educationType === "SCHOOL") {
      await requirePrincipal(user.id);

      const devCode = String(formData.get("devCode") ?? "").trim();
      const expected = process.env.SCHOOL_CREATION_DEV_CODE;
      if (!expected || devCode !== expected) {
        throw new Error("That developer code isn't valid. Locker is $85/month per school — contact us to subscribe.");
      }
    }

    const parsed = createSchoolSchema.safeParse({ name: formData.get("name") });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid name");

    const normalized = normalizeSchoolName(parsed.data.name);
    const existingSchools = await db.school.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    });
    const duplicate = existingSchools.find((s) => normalizeSchoolName(s.name) === normalized);
    if (duplicate) {
      throw new Error(`"${duplicate.name}" already exists — search for it instead of creating a duplicate.`);
    }

    const slug =
      parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") +
      "-" +
      generateCode(4).toLowerCase();

    const school = await db.school.create({
      data: {
        name: parsed.data.name,
        slug,
        founderId: user.id,
        // SCHOOL only — this is the code a Principal shares with their
        // teachers so they can join the institution itself (SchoolTeacher),
        // the actual gate behind createClass/joinClassAsTeacher. COLLEGE
        // has no such gate, so no code is generated for it.
        teacherInviteCode: dbUser.educationType === "SCHOOL" ? generateCode(6) : null,
      },
    });

    return { id: school.id, name: school.name, slug: school.slug };
  } catch (e) {
    return handleActionError(e);
  }
}

/**
 * A teacher redeems their Principal's staff code to become staff of a
 * school (SchoolTeacher) — required before they can create or join any
 * class there. This is the actual mechanism behind "a teacher can join any
 * class in their school, but not any school": finding a school in search
 * is not the same as being allowed to act inside it.
 */
export async function joinSchoolAsTeacher(formData: FormData): Promise<{ error: string } | { id: string; name: string }> {
  try {
    const user = await requireUser();
    await requireTeacherOrPrincipal(user.id);

    const code = String(formData.get("code") ?? "").trim().toUpperCase();
    if (!code) throw new Error("Enter your school's staff code");

    const school = await db.school.findUnique({ where: { teacherInviteCode: code } });
    if (!school) throw new Error("No school found for that staff code");

    await db.schoolTeacher.upsert({
      where: { schoolId_userId: { schoolId: school.id, userId: user.id } },
      create: { schoolId: school.id, userId: user.id },
      update: {},
    });

    revalidatePath("/onboarding");
    return { id: school.id, name: school.name };
  } catch (e) {
    return handleActionError(e);
  }
}

/** Principal only — rotates the staff code so a leaked one stops working. */
export async function regenerateSchoolTeacherCode(schoolId: string): Promise<{ error: string } | string> {
  try {
    const user = await requireUser();
    await requireSchoolFounder(user.id, schoolId);

    const teacherInviteCode = generateCode(6);
    await db.school.update({ where: { id: schoolId }, data: { teacherInviteCode } });
    revalidatePath("/school/settings");
    return teacherInviteCode;
  } catch (e) {
    return handleActionError(e);
  }
}

const editSchoolSchema = z.object({ name: z.string().min(2).max(120) });

/** School Founder only — Class Founders never reach this. */
export async function editSchoolInfo(schoolId: string, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireSchoolFounder(user.id, schoolId);

    const parsed = editSchoolSchema.safeParse({ name: formData.get("name") });
    if (!parsed.success) throw new Error("Invalid school name");

    await db.school.update({ where: { id: schoolId }, data: { name: parsed.data.name } });
    revalidatePath("/school/settings");
  } catch (e) {
    return handleActionError(e);
  }
}

/** School Founder assigns a moderator by email — must already be part of the school. */
export async function assignSchoolModerator(schoolId: string, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireSchoolFounder(user.id, schoolId);

    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const target = await db.user.findUnique({ where: { email } });
    if (!target) throw new Error("No Locker user with that email");

    const isInSchool = await db.membership.findFirst({
      where: { userId: target.id, schoolId },
    });
    if (!isInSchool) throw new Error("That student isn't part of this school yet");

    await db.schoolModerator.upsert({
      where: { schoolId_userId: { schoolId, userId: target.id } },
      create: { schoolId, userId: target.id, grantedById: user.id },
      update: {},
    });

    revalidatePath("/school/settings");
  } catch (e) {
    return handleActionError(e);
  }
}

export async function removeSchoolModerator(schoolId: string, targetUserId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireSchoolFounder(user.id, schoolId);

    await db.schoolModerator.deleteMany({ where: { schoolId, userId: targetUserId } });
    revalidatePath("/school/settings");
  } catch (e) {
    return handleActionError(e);
  }
}

/** School Founder or School Moderator: moderation action, not a launch gate. */
export async function removeClassFromSchool(schoolId: string, classId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireSchoolModerator(user.id, schoolId);

    await db.class.update({ where: { id: classId }, data: { status: "REMOVED" } });
    revalidatePath("/school/settings");
  } catch (e) {
    return handleActionError(e);
  }
}

/** Reinstates a previously removed class. */
export async function restoreClassInSchool(schoolId: string, classId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireSchoolModerator(user.id, schoolId);

    await db.class.update({ where: { id: classId }, data: { status: "ACTIVE" } });
    revalidatePath("/school/settings");
  } catch (e) {
    return handleActionError(e);
  }
}

/**
 * School Founder hands ownership to another member of the school, by
 * email. For a real SCHOOL (founded by a PRINCIPAL — see requirePrincipal
 * in createSchool), the new owner must also hold the PRINCIPAL role,
 * otherwise this would silently hand a whole institution to a student or
 * teacher account. COLLEGE keeps the original any-member handoff.
 */
export async function transferSchoolOwnership(schoolId: string, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireSchoolFounder(user.id, schoolId);

    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const target = await db.user.findUnique({ where: { email } });
    if (!target) throw new Error("No Locker user with that email");

    const currentOwner = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
    if (currentOwner?.role === "PRINCIPAL" && target.role !== "PRINCIPAL") {
      throw new Error("The new owner must also have the Principal/IT Admin role.");
    }

    const isMember = await db.membership.findFirst({
      where: { userId: target.id, schoolId },
    });
    if (!isMember) throw new Error("New owner must already be part of this school");

    await db.school.update({ where: { id: schoolId }, data: { founderId: target.id } });
    revalidatePath("/school/settings");
  } catch (e) {
    return handleActionError(e);
  }
}
