import { db } from "@/core/db/client";
import {
  canGovernClass,
  canManageClass,
  canAccessSchoolSettings,
  canEditSchoolInfo,
  canTransferSchoolOwnership,
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
