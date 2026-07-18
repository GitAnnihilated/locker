import { db } from "@/core/db/client";
import { cosmeticPerksSelect, withCosmetics } from "@/core/rewards/cosmetics";

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

/**
 * The school this user has founder/moderator authority over, if any —
 * resolved directly from School.founderId / SchoolModerator, independent of
 * whichever class they happen to be actively a member of. This is what
 * School Settings should always resolve through: a School Founder shouldn't
 * lose access just because their most recent class membership is in a
 * different school, or because they have no class membership at all.
 */
export async function getManagedSchool(userId: string) {
  const founded = await db.school.findFirst({ where: { founderId: userId, deletedAt: null } });
  if (founded) return founded;

  const modRow = await db.schoolModerator.findFirst({
    where: { userId, school: { deletedAt: null } },
    include: { school: true },
  });
  return modRow?.school ?? null;
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
  const moderators = await db.schoolModerator.findMany({
    where: { schoolId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, perks: cosmeticPerksSelect } },
    },
  });
  return moderators.map((m) => ({ ...m, user: withCosmetics(m.user) }));
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
