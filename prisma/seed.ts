import { ConditionStat, ConditionOp, DedupScope, Rarity, PerkSlot, PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ============================================================
// REWARDS CONFIG — this IS the "insert data, don't rewrite logic" system.
// Adding a badge/perk/level/point-earning action is adding a row here and
// re-running `npm run db:seed` — src/core/rewards/engine.ts never changes.
// ============================================================

const POINT_ACTIONS = [
  { key: "homework_completed", name: "Completed a homework item", points: 15, dedupScope: DedupScope.PER_REF, cooldownSec: 0 },
  { key: "resource_uploaded", name: "Uploaded a note/resource", points: 10, dedupScope: DedupScope.PER_REF, cooldownSec: 300 },
  { key: "group_created", name: "Started a study group", points: 25, dedupScope: DedupScope.PER_DAY, cooldownSec: 0 },
  { key: "group_joined", name: "Joined a study group", points: 10, dedupScope: DedupScope.PER_REF, cooldownSec: 0 },
  { key: "group_participation", name: "Participated in group chat", points: 8, dedupScope: DedupScope.PER_REF_PER_DAY, cooldownSec: 0 },
  { key: "class_joined", name: "Joined a class", points: 15, dedupScope: DedupScope.PER_REF, cooldownSec: 0 },
  { key: "school_joined", name: "Joined a school", points: 20, dedupScope: DedupScope.PER_REF, cooldownSec: 0 },
  { key: "profile_completed", name: "Completed your profile", points: 30, dedupScope: DedupScope.PER_REF, cooldownSec: 0 },
  { key: "daily_login", name: "Showed up today", points: 5, dedupScope: DedupScope.PER_DAY, cooldownSec: 0 },
  { key: "streak_milestone", name: "Streak milestone bonus", points: 0, dedupScope: DedupScope.PER_REF, cooldownSec: 0 }, // points set per-milestone by the engine, not this row
];

const BADGES = [
  { key: "first_steps", name: "First Steps", description: "Complete onboarding — join your first class.", icon: "🎯", rarity: Rarity.COMMON, conditionStat: ConditionStat.ONBOARDING_DONE, conditionOp: ConditionOp.GTE, conditionValue: 1, sortOrder: 0 },
  { key: "week_streak", name: "7-Day Streak", description: "Maintain a 7-day activity streak.", icon: "🔥", rarity: Rarity.COMMON, conditionStat: ConditionStat.LONGEST_STREAK, conditionOp: ConditionOp.GTE, conditionValue: 7, sortOrder: 1 },
  { key: "homework_hero", name: "Homework Hero", description: "Complete 25 homework tasks.", icon: "📚", rarity: Rarity.RARE, conditionStat: ConditionStat.HOMEWORK_COMPLETED, conditionOp: ConditionOp.GTE, conditionValue: 25, sortOrder: 2 },
  { key: "team_player", name: "Team Player", description: "Participate in 10 different groups.", icon: "👥", rarity: Rarity.RARE, conditionStat: ConditionStat.GROUPS_JOINED, conditionOp: ConditionOp.GTE, conditionValue: 10, sortOrder: 3 },
  { key: "consistency_30", name: "Consistency", description: "Maintain a 30-day activity streak.", icon: "🔥", rarity: Rarity.EPIC, conditionStat: ConditionStat.LONGEST_STREAK, conditionOp: ConditionOp.GTE, conditionValue: 30, sortOrder: 4 },
  { key: "note_master", name: "Note Master", description: "Upload 50 notes or resources.", icon: "📝", rarity: Rarity.EPIC, conditionStat: ConditionStat.RESOURCES_UPLOADED, conditionOp: ConditionOp.GTE, conditionValue: 50, sortOrder: 5 },
  { key: "early_adopter", name: "Early Adopter", description: "One of the first 100 registered users.", icon: "🚀", rarity: Rarity.LEGENDARY, conditionStat: ConditionStat.ACCOUNT_RANK, conditionOp: ConditionOp.LTE, conditionValue: 100, sortOrder: 6 },
  { key: "top_contributor", name: "Top Contributor", description: "Reach 2,000 lifetime points earned.", icon: "🏆", rarity: Rarity.LEGENDARY, conditionStat: ConditionStat.TOTAL_POINTS_EARNED, conditionOp: ConditionOp.GTE, conditionValue: 2000, sortOrder: 7 },
  { key: "legend_100", name: "Legend", description: "Maintain a 100-day activity streak.", icon: "👑", rarity: Rarity.LEGENDARY, conditionStat: ConditionStat.LONGEST_STREAK, conditionOp: ConditionOp.GTE, conditionValue: 100, sortOrder: 8 },
];

const PERKS = [
  // Name colors — cosmetic, applied to display name in chat/profile.
  { key: "name_color_teal", name: "Teal Name", description: "Tint your display name teal.", icon: "🎨", rarity: Rarity.COMMON, slot: PerkSlot.NAME_COLOR, price: 100, purchasable: true, value: "#0d9488", sortOrder: 0 },
  { key: "name_color_purple", name: "Purple Name", description: "Tint your display name purple.", icon: "🎨", rarity: Rarity.COMMON, slot: PerkSlot.NAME_COLOR, price: 150, purchasable: true, value: "#7c3aed", sortOrder: 1 },
  { key: "name_color_gold", name: "Gold Name", description: "Tint your display name gold.", icon: "🎨", rarity: Rarity.RARE, slot: PerkSlot.NAME_COLOR, price: 400, purchasable: true, value: "#ca8a04", sortOrder: 2 },

  // Avatar frames.
  { key: "frame_bronze", name: "Bronze Frame", description: "A bronze ring around your avatar.", icon: "🖼️", rarity: Rarity.COMMON, slot: PerkSlot.AVATAR_FRAME, price: 200, purchasable: true, value: "ring-amber-700", sortOrder: 0 },
  { key: "frame_silver", name: "Silver Frame", description: "A silver ring around your avatar.", icon: "🖼️", rarity: Rarity.RARE, slot: PerkSlot.AVATAR_FRAME, price: 500, purchasable: true, value: "ring-slate-400", sortOrder: 1 },
  { key: "frame_gold", name: "Gold Frame", description: "A gold ring around your avatar.", icon: "🖼️", rarity: Rarity.EPIC, slot: PerkSlot.AVATAR_FRAME, price: 900, purchasable: true, value: "ring-yellow-400", sortOrder: 2 },
  { key: "cosmetic_veteran_frame", name: "Veteran Frame", description: "Exclusive frame — earned at a 60-day streak, not for sale.", icon: "🖼️", rarity: Rarity.EPIC, slot: PerkSlot.AVATAR_FRAME, price: 0, purchasable: false, value: "ring-cyan-400", sortOrder: 3 },

  // Chat bubble styles — value is a theme key, mapped to actual classes in ChatThread.
  { key: "bubble_mint", name: "Mint Bubble", description: "A mint-colored chat bubble.", icon: "💬", rarity: Rarity.COMMON, slot: PerkSlot.CHAT_BUBBLE, price: 250, purchasable: true, value: "mint", sortOrder: 0 },
  { key: "bubble_sunset", name: "Sunset Bubble", description: "A warm sunset chat bubble.", icon: "💬", rarity: Rarity.COMMON, slot: PerkSlot.CHAT_BUBBLE, price: 250, purchasable: true, value: "sunset", sortOrder: 1 },
  { key: "bubble_midnight", name: "Midnight Bubble", description: "A sleek midnight chat bubble.", icon: "💬", rarity: Rarity.EPIC, slot: PerkSlot.CHAT_BUBBLE, price: 600, purchasable: true, value: "midnight", sortOrder: 2 },

  // Celebration effects — value is an effect key read by the celebration modal.
  { key: "celebration_confetti_gold", name: "Gold Confetti", description: "Gold confetti on every celebration.", icon: "🎉", rarity: Rarity.RARE, slot: PerkSlot.CELEBRATION_EFFECT, price: 300, purchasable: true, value: "confetti-gold", sortOrder: 0 },
  { key: "celebration_fireworks", name: "Fireworks", description: "Fireworks on every celebration.", icon: "🎆", rarity: Rarity.EPIC, slot: PerkSlot.CELEBRATION_EFFECT, price: 700, purchasable: true, value: "fireworks", sortOrder: 1 },

  // Cosmetic (purchasable) badge — distinct from earned Badge records, purely decorative.
  { key: "cosmetic_supporter", name: "Supporter", description: "A cosmetic badge showing you back Locker.", icon: "💎", rarity: Rarity.RARE, slot: PerkSlot.COSMETIC_BADGE, price: 500, purchasable: true, value: null, sortOrder: 0 },

  // Utility (consumable) — no academic advantage, just streak insurance.
  { key: "streak_shield", name: "Streak Shield", description: "Protects your streak the next time you miss a day. Also granted free at a 30-day streak.", icon: "🛡️", rarity: Rarity.COMMON, slot: PerkSlot.UTILITY, price: 300, purchasable: true, value: null, sortOrder: 0 },
  { key: "streak_revival_token", name: "Streak Revival Token", description: "Restore a streak you recently lost.", icon: "💊", rarity: Rarity.COMMON, slot: PerkSlot.UTILITY, price: 200, purchasable: true, value: null, sortOrder: 1 },
];

// Cumulative totalEarned required per level — increasing gaps, tune freely.
const LEVELS = [
  { level: 1, pointsNeeded: 0, title: "Newcomer" },
  { level: 2, pointsNeeded: 50, title: "Rookie" },
  { level: 3, pointsNeeded: 150, title: "Learner" },
  { level: 4, pointsNeeded: 300, title: "Achiever" },
  { level: 5, pointsNeeded: 500, title: "Scholar" },
  { level: 6, pointsNeeded: 750, title: "Contributor" },
  { level: 7, pointsNeeded: 1050, title: "Collaborator" },
  { level: 8, pointsNeeded: 1400, title: "Mentor" },
  { level: 9, pointsNeeded: 1800, title: "Expert" },
  { level: 10, pointsNeeded: 2250, title: "Master" },
  { level: 11, pointsNeeded: 2750, title: "Champion" },
  { level: 12, pointsNeeded: 3300, title: "Elite" },
  { level: 13, pointsNeeded: 3900, title: "Luminary" },
  { level: 14, pointsNeeded: 4550, title: "Icon" },
  { level: 15, pointsNeeded: 5250, title: "Legend" },
];

async function main() {
  for (const a of POINT_ACTIONS) {
    await db.pointAction.upsert({ where: { key: a.key }, create: a, update: a });
  }
  for (const b of BADGES) {
    await db.badge.upsert({ where: { key: b.key }, create: b, update: b });
  }
  for (const p of PERKS) {
    await db.perk.upsert({ where: { key: p.key }, create: p, update: p });
  }
  for (const l of LEVELS) {
    await db.levelDef.upsert({ where: { level: l.level }, create: l, update: l });
  }
  console.log(
    `Seeded ${POINT_ACTIONS.length} point actions, ${BADGES.length} badges, ${PERKS.length} perks, ${LEVELS.length} levels.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
