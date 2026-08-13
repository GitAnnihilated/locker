import { db } from "@/core/db/client";

/**
 * Every ACTIVE class in a school the teacher is already staff of
 * (Principal, or a redeemed SchoolTeacher row), minus classes they already
 * teach — the actual "join any class in their school" browse list. Scoped
 * to schools the caller is staff of, never any school they can merely find
 * in search, which is the whole point of the feature.
 */
export async function getJoinableClassesForTeacher(userId: string) {
  const [foundedSchoolIds, staffSchoolIds, alreadyTeaching] = await Promise.all([
    db.school.findMany({ where: { founderId: userId, deletedAt: null }, select: { id: true } }),
    db.schoolTeacher.findMany({ where: { userId }, select: { schoolId: true } }),
    db.classTeacher.findMany({ where: { teacherId: userId }, select: { classId: true } }),
  ]);

  const schoolIds = [...new Set([...foundedSchoolIds.map((s) => s.id), ...staffSchoolIds.map((s) => s.schoolId)])];
  if (schoolIds.length === 0) return [];

  const classes = await db.class.findMany({
    where: {
      schoolId: { in: schoolIds },
      status: "ACTIVE",
      deletedAt: null,
      teacherId: { not: null }, // SCHOOL classes only — COLLEGE never uses this flow
      id: { notIn: alreadyTeaching.map((c) => c.classId) },
    },
    select: {
      id: true,
      name: true,
      school: { select: { id: true, name: true } },
      classTeachers: { select: { subject: true, teacher: { select: { name: true } } } },
    },
    orderBy: { name: "asc" },
  });

  return classes;
}

/** Every class the teacher teaches, with schoolId — CreateGroupForm needs to know which school each belongs to. */
export async function getTaughtClassesWithSchool(userId: string) {
  const rows = await db.classTeacher.findMany({
    where: { teacherId: userId, class: { status: "ACTIVE", deletedAt: null } },
    select: { subject: true, class: { select: { id: true, name: true, schoolId: true } } },
    orderBy: { class: { name: "asc" } },
  });
  return rows.map((r) => ({ id: r.class.id, name: r.class.name, subject: r.subject, schoolId: r.class.schoolId }));
}

export async function getClassGroupsForTeacher(userId: string) {
  return db.classGroup.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: "desc" },
    include: { members: { include: { class: { select: { id: true, name: true } } } } },
  });
}

export async function getClassGroupDetail(groupId: string) {
  return db.classGroup.findUnique({
    where: { id: groupId },
    include: { members: { include: { class: { select: { id: true, name: true, inviteCode: true } } } } },
  });
}
