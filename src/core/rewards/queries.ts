import { db } from "@/core/db/client";
import { computeUserStats } from "./stats";
import { COSMETIC_SLOTS, reduceCosmetics, type EquippedCosmetics } from "./cosmetics";

export type { EquippedCosmetics };

// Read-first: avoids sending a write (upsert) to Postgres on every page
// load just to confirm a row that's already there almost every time.
async function getOrCreateProgress(userId: string) {
  const existing = await db.userProgress.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.userProgress.upsert({ where: { userId }, create: { userId }, update: {} });
}

export async function getProgressSummary(userId: string) {
  const [progress, levels] = await Promise.all([
    getOrCreateProgress(userId),
    db.levelDef.findMany({ orderBy: { level: "asc" } }),
  ]);

  const current = levels.find((l) => l.level === progress.level);
  const next = levels.find((l) => l.level === progress.level + 1);
  const floor = current?.pointsNeeded ?? 0;
  const ceiling = next?.pointsNeeded ?? floor;
  const span = ceiling - floor;
  const progressPct = next && span > 0 ? Math.min(100, Math.round(((progress.totalEarned - floor) / span) * 100)) : 100;

  return {
    ...progress,
    levelTitle: current?.title ?? null,
    nextLevelTitle: next?.title ?? null,
    pointsToNextLevel: next ? Math.max(0, next.pointsNeeded - progress.totalEarned) : 0,
    progressPct,
    isMaxLevel: !next,
  };
}

export async function getBadgeCollection(userId: string) {
  const [badges, unlocked, stats] = await Promise.all([
    db.badge.findMany({ orderBy: [{ sortOrder: "asc" }, { conditionValue: "asc" }] }),
    db.userBadge.findMany({ where: { userId } }),
    computeUserStats(userId),
  ]);
  const unlockedByBadgeId = new Map(unlocked.map((u) => [u.badgeId, u]));

  return badges.map((b) => {
    const unlock = unlockedByBadgeId.get(b.id);
    const value = stats[b.conditionStat];
    const progressPct =
      b.conditionOp === "GTE"
        ? Math.min(100, Math.round((value / b.conditionValue) * 100))
        : value <= b.conditionValue
          ? 100
          : 0;
    return {
      ...b,
      unlocked: !!unlock,
      unlockedAt: unlock?.unlockedAt ?? null,
      progressValue: value,
      progressPct: unlock ? 100 : Math.max(0, progressPct),
    };
  });
}

export async function getPerkStore(userId: string) {
  const [perks, owned, progress] = await Promise.all([
    db.perk.findMany({ orderBy: [{ slot: "asc" }, { sortOrder: "asc" }, { price: "asc" }] }),
    db.userPerk.findMany({ where: { userId } }),
    getOrCreateProgress(userId),
  ]);
  const ownedByPerkId = new Map(owned.map((o) => [o.perkId, o]));

  return {
    points: progress.points,
    perks: perks.map((p) => {
      const own = ownedByPerkId.get(p.id);
      return {
        ...p,
        owned: !!own,
        equipped: own?.equipped ?? false,
        quantity: own?.quantity ?? 0,
        affordable: progress.points >= p.price,
      };
    }),
  };
}

/** For single-user, low-cardinality contexts: header, own profile page. */
export async function getEquippedCosmetics(userId: string): Promise<EquippedCosmetics> {
  const rows = await db.userPerk.findMany({
    where: { userId, equipped: true, perk: { slot: { in: COSMETIC_SLOTS } } },
    select: { perk: { select: { slot: true, value: true } } },
  });
  return reduceCosmetics(rows);
}

/** Batched for list contexts (leaderboard, member rosters) — one query, not N. */
export async function getEquippedCosmeticsForUsers(userIds: string[]): Promise<Map<string, EquippedCosmetics>> {
  if (userIds.length === 0) return new Map();
  const rows = await db.userPerk.findMany({
    where: { userId: { in: userIds }, equipped: true, perk: { slot: { in: COSMETIC_SLOTS } } },
    select: { userId: true, perk: { select: { slot: true, value: true } } },
  });
  const byUser = new Map<string, { perk: { slot: (typeof rows)[number]["perk"]["slot"]; value: string | null } }[]>();
  for (const r of rows) {
    const list = byUser.get(r.userId) ?? [];
    list.push({ perk: r.perk });
    byUser.set(r.userId, list);
  }
  const result = new Map<string, EquippedCosmetics>();
  for (const [userId, list] of byUser) result.set(userId, reduceCosmetics(list));
  return result;
}

export async function getPendingCelebrations(userId: string) {
  return db.celebration.findMany({
    where: { userId, seen: false },
    orderBy: { createdAt: "asc" },
    take: 10,
  });
}

export type LeaderboardScope = "all-time" | "weekly" | "monthly" | "school";

/**
 * Ranks by totalEarned (all-time) or by points earned within a date window
 * (weekly/monthly, summed straight off PointEntry) — never raw current
 * `points`, since spending on perks would otherwise drop someone's rank.
 * "school" scope is all-time, filtered to members of the given school.
 */
export async function getLeaderboard(scope: LeaderboardScope, options: { schoolId?: string; limit?: number } = {}) {
  const limit = options.limit ?? 25;

  if (scope === "weekly" || scope === "monthly") {
    const since = new Date();
    if (scope === "weekly") since.setDate(since.getDate() - 7);
    else since.setMonth(since.getMonth() - 1);

    const grouped = await db.pointEntry.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: since } },
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
      take: limit,
    });
    const users = await db.user.findMany({
      where: { id: { in: grouped.map((g) => g.userId) } },
      select: { id: true, name: true, nickname: true, image: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));
    return grouped
      .map((g) => ({ user: byId.get(g.userId), score: g._sum.points ?? 0 }))
      .filter((r): r is { user: NonNullable<typeof r.user>; score: number } => !!r.user);
  }

  const where = scope === "school" && options.schoolId ? { memberships: { some: { schoolId: options.schoolId } } } : {};

  const progress = await db.userProgress.findMany({
    where: { user: where },
    orderBy: { totalEarned: "desc" },
    take: limit,
    include: { user: { select: { id: true, name: true, nickname: true, image: true } } },
  });
  return progress.map((p) => ({ user: p.user, score: p.totalEarned }));
}
