import { db } from "@/core/db/client";

export interface SchoolSearchResult {
  id: string;
  name: string;
  slug: string;
  classCount: number;
}

// Note: the actual search implementation lives in ./actions as a Server
// Action (searchSchools), since it needs to be callable directly from a
// "use client" component. This file stays query-only (server/RSC use).

export async function getSchool(schoolId: string) {
  return db.school.findUnique({ where: { id: schoolId } });
}

/** Classes a student can browse & join directly within a chosen school. */
export async function getSchoolClasses(schoolId: string) {
  const classes = await db.class.findMany({
    where: { schoolId, status: "ACTIVE", deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { memberships: true } } },
  });

  return classes.map((c) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    memberCount: c._count.memberships,
  }));
}

export async function getSchoolModerators(schoolId: string) {
  return db.schoolModerator.findMany({
    where: { schoolId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });
}

/** Classes a school founder/moderator is actively moderating (incl. removed, for review). */
export async function getSchoolClassesForModeration(schoolId: string) {
  return db.class.findMany({
    where: { schoolId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      founder: { select: { id: true, name: true, email: true } },
      _count: { select: { memberships: true } },
    },
  });
}
