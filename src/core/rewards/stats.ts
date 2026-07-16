import { db } from "@/core/db/client";
import { ConditionStat } from "@prisma/client";

/**
 * Everything a badge's unlock condition can be measured against, computed
 * fresh per user. Badge rows never hardcode how to count something — they
 * just name a stat here and a threshold. Add a new measurable stat = add
 * one enum value + one branch here; unlock logic itself never changes.
 */
export async function computeUserStats(userId: string): Promise<Record<ConditionStat, number>> {
  const self = await db.user.findUnique({ where: { id: userId }, select: { createdAt: true } });

  const [homeworkCompleted, resourcesUploaded, groupsJoined, groupsCreated, classesJoined, progress, accountRank] =
    await Promise.all([
      db.homeworkStatus.count({ where: { userId, done: true } }),
      db.groupResource.count({ where: { uploaderId: userId, deletedAt: null } }),
      db.groupMember.count({ where: { userId } }),
      db.groupActivity.count({ where: { actorId: userId, type: "created" } }),
      db.membership.count({ where: { userId } }),
      db.userProgress.findUnique({ where: { userId } }),
      db.user.count({ where: { createdAt: { lte: self?.createdAt ?? new Date() } } }),
    ]);

  return {
    [ConditionStat.HOMEWORK_COMPLETED]: homeworkCompleted,
    [ConditionStat.RESOURCES_UPLOADED]: resourcesUploaded,
    [ConditionStat.GROUPS_JOINED]: groupsJoined,
    [ConditionStat.GROUPS_CREATED]: groupsCreated,
    [ConditionStat.CURRENT_STREAK]: progress?.currentStreak ?? 0,
    [ConditionStat.LONGEST_STREAK]: progress?.longestStreak ?? 0,
    [ConditionStat.TOTAL_POINTS_EARNED]: progress?.totalEarned ?? 0,
    [ConditionStat.ACCOUNT_RANK]: accountRank,
    [ConditionStat.ONBOARDING_DONE]: classesJoined > 0 ? 1 : 0,
  };
}
