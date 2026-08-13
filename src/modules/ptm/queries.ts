import { db } from "@/core/db/client";

/**
 * Every class this user teaches — whether they created it or joined an
 * existing one (see ClassTeacher) — with the subject THEY personally
 * teach there. This is the "which PTM/roster board do I manage" list, and
 * the single source of truth the dashboard's "My classes" reads from too.
 */
export async function getTeacherClasses(userId: string) {
  const rows = await db.classTeacher.findMany({
    where: { teacherId: userId, class: { status: "ACTIVE", deletedAt: null } },
    select: { subject: true, class: { select: { id: true, name: true } } },
    orderBy: { class: { name: "asc" } },
  });
  return rows.map((r) => ({ id: r.class.id, name: r.class.name, subject: r.subject }));
}

/** All slots (any status) for one class the caller teaches, newest date first, for the manage view. */
export async function getSlotsForClass(classId: string) {
  return db.pTMSlot.findMany({
    where: { classId },
    include: {
      booking: { include: { bookedBy: { select: { id: true, name: true, image: true } } } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

/**
 * Classes a student/teacher-as-parent-proxy is a member of (SCHOOL only)
 * with any upcoming slots — the "book a PTM" board. Only classes with at
 * least one non-cancelled upcoming slot are returned, so an empty class
 * doesn't clutter the list.
 */
export async function getBookableClasses(userId: string) {
  const memberships = await db.membership.findMany({
    where: { userId },
    select: { classId: true },
  });
  const classIds = memberships.map((m) => m.classId);
  if (classIds.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const classes = await db.class.findMany({
    where: {
      id: { in: classIds },
      status: "ACTIVE",
      deletedAt: null,
      ptmSlots: { some: { date: { gte: today }, status: { not: "CANCELLED" } } },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return classes;
}

/** Upcoming (today or later), non-cancelled slots for one class — the booking grid. */
export async function getUpcomingSlotsForClass(classId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return db.pTMSlot.findMany({
    where: { classId, date: { gte: today }, status: { not: "CANCELLED" } },
    include: {
      booking: { include: { bookedBy: { select: { id: true, name: true } } } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}
