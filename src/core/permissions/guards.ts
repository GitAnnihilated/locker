import { db } from "@/core/db/client";
import type { UserRole } from "@prisma/client";
import {
  canGovernClass,
  canManageClass,
  canAccessSchoolSettings,
  canEditSchoolInfo,
  canTransferSchoolOwnership,
  canGovernClassAsSchool,
  canManageClassAsSchool,
  type ClassContext,
  type SchoolContext,
} from "./rules";

async function loadClassContext(classId: string): Promise<ClassContext> {
  const [klass, moderators] = await Promise.all([
    db.class.findUniqueOrThrow({ where: { id: classId }, select: { founderId: true } }),
    db.membership.findMany({
      where: { classId, role: "MODERATOR" },
      select: { userId: true },
    }),
  ]);
  return {
    founderId: klass.founderId,
    moderatorUserIds: moderators.map((m) => m.userId),
  };
}

async function loadSchoolContext(schoolId: string): Promise<SchoolContext> {
  const [school, moderators] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { founderId: true } }),
    db.schoolModerator.findMany({ where: { schoolId }, select: { userId: true } }),
  ]);
  return {
    founderId: school.founderId,
    moderatorUserIds: moderators.map((m) => m.userId),
  };
}

/**
 * Global role gate — always re-reads User.role fresh from the DB, never
 * trusts a client-supplied role. Used ahead of institution-creating actions
 * (createSchool, createClass for SCHOOL) where the pre-existing
 * founder/moderator model has nothing to check yet (the row doesn't exist).
 */
export async function requireRole(userId: string, allowed: UserRole[]) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true } });
  if (!allowed.includes(user.role)) {
    throw new Error(`This requires the ${allowed.join(" or ").toLowerCase()} role.`);
  }
  return user.role;
}

/** Only a PRINCIPAL may create/own a School. */
export async function requirePrincipal(userId: string) {
  return requireRole(userId, ["PRINCIPAL"]);
}

/** A TEACHER or PRINCIPAL may create a Class. Students may only join one. */
export async function requireTeacherOrPrincipal(userId: string) {
  return requireRole(userId, ["TEACHER", "PRINCIPAL"]);
}

/**
 * Throws unless the caller is one of THIS class's subject teachers (any
 * ClassTeacher row, not just the original creator/Founder) — PTM slots,
 * the Student Notebook, and roster access are all per-subject-teacher
 * activities, not governance. Renaming/archiving/removing a student stays
 * Founder-only (see requireClassGovernor) — this is deliberately broader.
 */
export async function requireClassTeacher(userId: string, classId: string) {
  const ct = await db.classTeacher.findUnique({
    where: { classId_teacherId: { classId, teacherId: userId } },
  });
  if (!ct) throw new Error("Only a teacher of this class can do that.");
  return ct;
}

/**
 * Throws unless the caller is already staff of this SCHOOL — its Principal
 * (School.founderId), or holds a SchoolTeacher row (redeemed via
 * School.teacherInviteCode). This is the actual gate behind "a teacher can
 * join any class in their school, but not any school": createClass and
 * joinClassAsTeacher both require this before touching a school they
 * haven't been invited into. COLLEGE never calls this — it keeps its
 * original no-gatekeeping model.
 */
export async function requireSchoolStaff(userId: string, schoolId: string) {
  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { founderId: true } });
  if (school.founderId === userId) return;

  const staff = await db.schoolTeacher.findUnique({
    where: { schoolId_userId: { schoolId, userId } },
  });
  if (!staff) {
    throw new Error("You need to join this school with your Principal's staff code first.");
  }
}

/**
 * Throws unless the caller teaches a class the given student is actually a
 * member of — the Student Notebook's core authorization check. A teacher
 * can only ever see/log notes about, or verify achievements for, students
 * genuinely in one of their own classes, never anyone else.
 */
export async function requireTeacherOfStudent(teacherId: string, studentId: string, classId: string) {
  const membership = await db.membership.findUnique({
    where: { userId_classId: { userId: studentId, classId } },
  });
  if (!membership) throw new Error("That student isn't a member of this class.");
  return requireClassTeacher(teacherId, classId);
}

/** Throws if the user is neither the Class Founder nor a Class Moderator. */
export async function requireClassManager(userId: string, classId: string) {
  const ctx = await loadClassContext(classId);
  if (!canManageClass(userId, ctx)) {
    throw new Error("You don't have permission to manage this class.");
  }
  return ctx;
}

/** Throws unless the user is specifically the Class Founder (governance actions). */
export async function requireClassFounder(userId: string, classId: string) {
  const ctx = await loadClassContext(classId);
  if (!canGovernClass(userId, ctx)) {
    throw new Error("Only the class founder can do that.");
  }
  return ctx;
}

/** Throws unless the user is the School Founder or a School Moderator. */
export async function requireSchoolModerator(userId: string, schoolId: string) {
  const ctx = await loadSchoolContext(schoolId);
  if (!canAccessSchoolSettings(userId, ctx)) {
    throw new Error("You don't have permission to manage this school.");
  }
  return ctx;
}

/** Throws unless the user is specifically the School Founder. */
export async function requireSchoolFounder(userId: string, schoolId: string) {
  const ctx = await loadSchoolContext(schoolId);
  if (!canEditSchoolInfo(userId, ctx) || !canTransferSchoolOwnership(userId, ctx)) {
    throw new Error("Only the school founder can do that.");
  }
  return ctx;
}

/**
 * Class Founder, OR the School Founder of that class's school (governance
 * actions: rename, promote/demote moderator, transfer ownership, archive).
 * A School Founder never needs to be a member of the class to govern it.
 */
export async function requireClassGovernor(userId: string, classId: string) {
  const klass = await db.class.findUniqueOrThrow({ where: { id: classId }, select: { schoolId: true } });
  const classCtx = await loadClassContext(classId);
  if (canGovernClass(userId, classCtx)) return classCtx;

  const schoolCtx = await loadSchoolContext(klass.schoolId);
  if (!canGovernClassAsSchool(userId, schoolCtx)) {
    throw new Error("Only the class founder or school founder can do that.");
  }
  return classCtx;
}

/**
 * Class Founder/Moderator, OR the School Founder/Moderator of that class's
 * school (day-to-day management: invite code, removing a member).
 */
export async function requireClassManagerOrSchoolAuthority(userId: string, classId: string) {
  const klass = await db.class.findUniqueOrThrow({ where: { id: classId }, select: { schoolId: true } });
  const classCtx = await loadClassContext(classId);
  if (canManageClass(userId, classCtx)) return classCtx;

  const schoolCtx = await loadSchoolContext(klass.schoolId);
  if (!canManageClassAsSchool(userId, schoolCtx)) {
    throw new Error("You don't have permission to manage this class.");
  }
  return classCtx;
}
