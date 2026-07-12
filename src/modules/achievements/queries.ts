import { db } from "@/core/db/client";
import { LEVEL_META } from "./meta";

/** Owner view — every achievement regardless of visibility, newest accomplishment first. */
export async function getAchievementsForUser(userId: string) {
  return db.achievement.findMany({
    where: { userId, deletedAt: null },
    orderBy: { achievedOn: "desc" },
  });
}

export type PortfolioAchievement = Awaited<
  ReturnType<typeof getAchievementsForUser>
>[number];

/** Lightweight count for dashboard summary tiles — avoids fetching every row. */
export async function getAchievementCount(userId: string) {
  return db.achievement.count({ where: { userId, deletedAt: null } });
}

/** Real-portfolio stats — no points, just counts by level (the "LinkedIn" framing). */
export async function getAchievementStats(userId: string) {
  const achievements = await db.achievement.findMany({
    where: { userId, deletedAt: null },
    select: { level: true },
  });

  const byLevel = Object.fromEntries(
    Object.keys(LEVEL_META).map((level) => [level, 0]),
  ) as Record<keyof typeof LEVEL_META, number>;

  for (const a of achievements) byLevel[a.level]++;

  return { total: achievements.length, byLevel };
}
