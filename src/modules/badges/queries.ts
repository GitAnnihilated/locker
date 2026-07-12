import { db } from "@/core/db/client";

/** Platform engagement rewards — distinct from Achievements (real-life accomplishments). */
export async function getBadgesForUser(userId: string) {
  const [defs, unlocks] = await Promise.all([
    db.badge.findMany({ orderBy: { points: "asc" } }),
    db.badgeUnlock.findMany({ where: { userId } }),
  ]);

  const unlockedIds = new Set(unlocks.map((u) => u.badgeId));

  return defs.map((d) => ({
    ...d,
    unlocked: unlockedIds.has(d.id),
  }));
}

export async function getBadgeCount(userId: string) {
  return db.badgeUnlock.count({ where: { userId } });
}
