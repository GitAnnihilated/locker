import { db } from "@/core/db/client";
import { computeUserStats } from "./stats";

/**
 * The Rewards engine. Every function here is generic — it reads Badge/
 * Perk/LevelDef/PointAction rows and evaluates them uniformly. Adding a
 * new badge, perk, level, or point-earning action is an INSERT into one of
 * those tables (see prisma/seed.ts), never a change to this file.
 */

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

async function getOrCreateProgress(userId: string) {
  return db.userProgress.upsert({ where: { userId }, create: { userId }, update: {} });
}

async function pushCelebration(
  userId: string,
  type: "BADGE" | "LEVEL_UP" | "PERK" | "STREAK_MILESTONE",
  data: { title: string; description?: string; icon?: string; rarity?: "COMMON" | "RARE" | "EPIC" | "LEGENDARY" },
) {
  await db.celebration.create({ data: { userId, type, ...data } });
}

/**
 * Recompute totalEarned -> level from the seeded LevelDef curve. Called
 * after every point award; cheap (a handful of rows, no index pressure).
 */
async function recalculateLevel(userId: string): Promise<void> {
  const [progress, levels] = await Promise.all([
    db.userProgress.findUnique({ where: { userId } }),
    db.levelDef.findMany({ orderBy: { level: "asc" } }),
  ]);
  if (!progress) return;

  let newLevel = 1;
  for (const l of levels) {
    if (progress.totalEarned >= l.pointsNeeded) newLevel = l.level;
    else break;
  }
  if (newLevel === progress.level) return;

  await db.userProgress.update({ where: { userId }, data: { level: newLevel } });
  const def = levels.find((l) => l.level === newLevel);
  await pushCelebration(userId, "LEVEL_UP", {
    title: def?.title ? `Level ${newLevel}: ${def.title}` : `Level ${newLevel}`,
    description: "You leveled up!",
    icon: "⭐",
  });
}

/**
 * Compares every not-yet-unlocked badge's condition against a fresh stats
 * snapshot and unlocks whatever now qualifies. This is the ONLY place a
 * badge's condition is ever evaluated — no per-badge branches, ever.
 */
export async function checkAndUnlockBadges(userId: string): Promise<void> {
  const [badges, unlocked, stats] = await Promise.all([
    db.badge.findMany(),
    db.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
    computeUserStats(userId),
  ]);
  const unlockedIds = new Set(unlocked.map((u) => u.badgeId));

  const toUnlock = badges.filter((b) => {
    if (unlockedIds.has(b.id)) return false;
    const value = stats[b.conditionStat];
    return b.conditionOp === "GTE" ? value >= b.conditionValue : value <= b.conditionValue;
  });
  if (toUnlock.length === 0) return;

  await db.userBadge.createMany({
    data: toUnlock.map((b) => ({ badgeId: b.id, userId })),
    skipDuplicates: true,
  });

  for (const badge of toUnlock) {
    await pushCelebration(userId, "BADGE", {
      title: badge.name,
      description: badge.description,
      icon: badge.icon,
      rarity: badge.rarity,
    });
  }
}

/**
 * Grants a perk directly (streak milestones, admin grants) — bypasses
 * price/ownership checks that purchasePerk enforces. Consumables (UTILITY
 * slot) stack quantity; equippable perks are just (re-)owned.
 */
export async function grantPerk(userId: string, perkKey: string): Promise<void> {
  const perk = await db.perk.findUnique({ where: { key: perkKey } });
  if (!perk) return;

  await db.userPerk.upsert({
    where: { perkId_userId: { perkId: perk.id, userId } },
    create: { perkId: perk.id, userId, quantity: 1 },
    update: { quantity: { increment: 1 } },
  });
  await pushCelebration(userId, "PERK", {
    title: perk.name,
    description: perk.description,
    icon: perk.icon,
    rarity: perk.rarity,
  });
}

const STREAK_MILESTONES: { days: number; bonusPoints?: number; grantPerkKey?: string }[] = [
  { days: 3, bonusPoints: 20 },
  { days: 14, bonusPoints: 50 },
  { days: 30, grantPerkKey: "streak_shield" },
  { days: 60, grantPerkKey: "cosmetic_veteran_frame" },
];

async function applyStreakMilestones(userId: string, streak: number): Promise<void> {
  const milestone = STREAK_MILESTONES.find((m) => m.days === streak);
  if (!milestone) return;

  if (milestone.bonusPoints) {
    await db.$transaction([
      db.pointEntry.create({
        data: { userId, action: "streak_milestone", points: milestone.bonusPoints, refId: String(streak) },
      }),
      db.userProgress.update({
        where: { userId },
        data: { points: { increment: milestone.bonusPoints }, totalEarned: { increment: milestone.bonusPoints } },
      }),
    ]);
    await pushCelebration(userId, "STREAK_MILESTONE", {
      title: `${streak}-Day Streak`,
      description: `+${milestone.bonusPoints} bonus points`,
      icon: "🔥",
    });
    await recalculateLevel(userId);
  }

  if (milestone.grantPerkKey) {
    await grantPerk(userId, milestone.grantPerkKey);
  }
}

/**
 * Call once per session on any authenticated page load (see AppLayout).
 * No-ops if already checked in today. A missed day resets the streak to 1
 * unless a Streak Shield is consumed to preserve it.
 */
export async function recordDailyActivity(userId: string): Promise<void> {
  const progress = await getOrCreateProgress(userId);
  const today = startOfDay(new Date());
  const last = progress.lastActiveOn ? startOfDay(progress.lastActiveOn) : null;

  if (last && last.getTime() === today.getTime()) return; // already checked in today

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak: number;
  if (last === null || last.getTime() === yesterday.getTime()) {
    newStreak = progress.currentStreak + 1;
  } else {
    const shield = await db.userPerk.findFirst({
      where: { userId, quantity: { gt: 0 }, perk: { key: "streak_shield" } },
    });
    if (shield) {
      await db.userPerk.update({ where: { id: shield.id }, data: { quantity: { decrement: 1 } } });
      newStreak = progress.currentStreak + 1;
    } else {
      newStreak = 1;
    }
  }

  const longestStreak = Math.max(progress.longestStreak, newStreak);
  await db.userProgress.update({
    where: { userId },
    data: { currentStreak: newStreak, longestStreak, lastActiveOn: new Date() },
  });

  await applyStreakMilestones(userId, newStreak);
  await checkAndUnlockBadges(userId);
}

/**
 * Awards points for a meaningful action, enforcing cooldown/dedup entirely
 * from the PointAction row's own fields — never a per-action special case.
 * Silently no-ops on cooldown/dedup/unknown-action, since "you didn't earn
 * points this time" is never an error worth surfacing to the user.
 */
export async function awardPoints(userId: string, actionKey: string, refId?: string): Promise<void> {
  const action = await db.pointAction.findUnique({ where: { key: actionKey } });
  if (!action || !action.enabled) return;

  const now = new Date();

  if (action.dedupScope === "PER_REF" && refId) {
    const exists = await db.pointEntry.findFirst({ where: { userId, action: actionKey, refId } });
    if (exists) return;
  } else if (action.dedupScope === "PER_DAY") {
    const exists = await db.pointEntry.findFirst({
      where: { userId, action: actionKey, createdAt: { gte: startOfDay(now) } },
    });
    if (exists) return;
  } else if (action.dedupScope === "PER_REF_PER_DAY" && refId) {
    const exists = await db.pointEntry.findFirst({
      where: { userId, action: actionKey, refId, createdAt: { gte: startOfDay(now) } },
    });
    if (exists) return;
  }

  if (action.cooldownSec > 0) {
    const since = new Date(now.getTime() - action.cooldownSec * 1000);
    const recent = await db.pointEntry.findFirst({ where: { userId, action: actionKey, createdAt: { gte: since } } });
    if (recent) return;
  }

  await getOrCreateProgress(userId);
  await db.$transaction([
    db.pointEntry.create({ data: { userId, action: actionKey, points: action.points, refId } }),
    db.userProgress.update({
      where: { userId },
      data: { points: { increment: action.points }, totalEarned: { increment: action.points } },
    }),
  ]);

  await recalculateLevel(userId);
  await checkAndUnlockBadges(userId);
}

export async function purchasePerk(userId: string, perkKey: string): Promise<{ error: string } | { ok: true }> {
  const perk = await db.perk.findUnique({ where: { key: perkKey } });
  if (!perk || !perk.purchasable) return { error: "This perk isn't available for purchase." };

  const progress = await getOrCreateProgress(userId);
  if (progress.points < perk.price) return { error: "Not enough points." };

  const existing = await db.userPerk.findUnique({ where: { perkId_userId: { perkId: perk.id, userId } } });
  if (existing && perk.slot !== "UTILITY") return { error: "You already own this." };

  await db.$transaction([
    db.userProgress.update({ where: { userId }, data: { points: { decrement: perk.price } } }),
    db.userPerk.upsert({
      where: { perkId_userId: { perkId: perk.id, userId } },
      create: { perkId: perk.id, userId, quantity: 1 },
      update: { quantity: { increment: 1 } },
    }),
  ]);
  await pushCelebration(userId, "PERK", {
    title: perk.name,
    description: perk.description,
    icon: perk.icon,
    rarity: perk.rarity,
  });
  return { ok: true };
}

export async function equipPerk(userId: string, perkKey: string): Promise<{ error: string } | { ok: true }> {
  const perk = await db.perk.findUnique({ where: { key: perkKey } });
  if (!perk) return { error: "Perk not found." };
  if (perk.slot === "UTILITY") return { error: "This perk can't be equipped." };

  const owned = await db.userPerk.findUnique({ where: { perkId_userId: { perkId: perk.id, userId } } });
  if (!owned) return { error: "You don't own this perk." };

  await db.$transaction([
    db.userPerk.updateMany({ where: { userId, perk: { slot: perk.slot } }, data: { equipped: false } }),
    db.userPerk.update({ where: { id: owned.id }, data: { equipped: true } }),
  ]);
  return { ok: true };
}

export async function unequipPerk(userId: string, perkKey: string): Promise<{ error: string } | { ok: true }> {
  const perk = await db.perk.findUnique({ where: { key: perkKey } });
  if (!perk) return { error: "Perk not found." };
  await db.userPerk.updateMany({ where: { userId, perkId: perk.id }, data: { equipped: false } });
  return { ok: true };
}
