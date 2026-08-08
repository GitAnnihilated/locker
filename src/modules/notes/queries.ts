import { db } from "@/core/db/client";
import { cosmeticPerksSelect } from "@/core/rewards/cosmetics";

async function getMyClassIds(userId: string): Promise<string[]> {
  const rows = await db.membership.findMany({ where: { userId }, select: { classId: true } });
  return rows.map((r) => r.classId);
}

const resourceInclude = {
  uploader: { select: { id: true, name: true, nickname: true, image: true, perks: cosmeticPerksSelect } },
  class: { select: { id: true, name: true, courseCode: true } },
} as const;

/** Resources for one specific course (used on the course detail page). */
export async function getCourseResources(classId: string) {
  return db.classResource.findMany({
    where: { classId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: resourceInclude,
  });
}

/** Every resource across every enrolled course, newest first — the Notes & Resources module's main feed. */
export async function getMyResources(userId: string) {
  const classIds = await getMyClassIds(userId);
  if (classIds.length === 0) return [];

  return db.classResource.findMany({
    where: { classId: { in: classIds }, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: resourceInclude,
  });
}

export type MyResource = Awaited<ReturnType<typeof getMyResources>>[number];
