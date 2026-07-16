import { db } from "@/core/db/client";
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
