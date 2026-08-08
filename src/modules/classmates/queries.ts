import { db } from "@/core/db/client";
import { getUserSchoolIds } from "@/modules/messages/queries";

/**
 * Same scoping discipline as messages/queries.ts's searchSchoolUsers — never
 * returns anyone outside a school the searcher actually shares, and never
 * exposes email in results (name/image only, same privacy stance as DMs'
 * people-picker). Adds an optional course filter on top, since a college
 * student's discovery use case is "who else is in Physics 101", which DMs'
 * search never needed.
 */
export async function searchClassmates(viewerId: string, query: string, courseId?: string) {
  const q = query.trim();
  const schoolIds = await getUserSchoolIds(viewerId);
  if (schoolIds.length === 0) return [];

  // One query, not "fetch candidate ids, then fetch those users" — the
  // membership scoping becomes a nested relation filter directly on User
  // instead of a separate round trip.
  const users = await db.user.findMany({
    where: {
      id: { not: viewerId },
      deletedAt: null,
      memberships: courseId ? { some: { classId: courseId } } : { some: { schoolId: { in: schoolIds } } },
      ...(q.length >= 1
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { nickname: { contains: q, mode: "insensitive" } }] }
        : {}),
    },
    select: {
      id: true,
      name: true,
      nickname: true,
      image: true,
      memberships: {
        where: { schoolId: { in: schoolIds } },
        select: { class: { select: { id: true, name: true, courseCode: true } } },
        take: 3,
      },
    },
    take: 30,
    orderBy: { name: "asc" },
  });

  return users;
}

export type Classmate = Awaited<ReturnType<typeof searchClassmates>>[number];

/** Courses shared with the viewer — powers the "filter by course" dropdown. */
export async function getMyCoursesForFilter(viewerId: string) {
  const rows = await db.membership.findMany({
    where: { userId: viewerId },
    select: { class: { select: { id: true, name: true, courseCode: true } } },
  });
  return rows.map((r) => r.class);
}
