import { db } from "@/core/db/client";
import { cosmeticPerksSelect } from "@/core/rewards/cosmetics";

const memberSelect = {
  select: { id: true, name: true, nickname: true, image: true, perks: cosmeticPerksSelect },
} as const;

/** Browse list for a class — also feeds the "does a duplicate already exist?" check. */
export async function getClassGroups(classId: string) {
  return db.group.findMany({
    where: { classId, deletedAt: null, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    include: {
      members: { include: { user: memberSelect } },
      _count: { select: { tasks: true } },
    },
  });
}

export type ClassGroup = Awaited<ReturnType<typeof getClassGroups>>[number];

/** Lightweight count for dashboard summary tiles. */
export async function getMyActiveGroupCount(classId: string, userId: string) {
  return db.group.count({
    where: {
      classId,
      deletedAt: null,
      status: { not: "ARCHIVED" },
      members: { some: { userId } },
    },
  });
}

export async function getMembership(groupId: string, userId: string) {
  return db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

export async function getMyPendingRequest(groupId: string, userId: string) {
  return db.groupJoinRequest.findFirst({
    where: { groupId, userId, status: "PENDING" },
  });
}

/** The full project workspace — one query powers the whole dashboard. */
export async function getGroupDashboard(groupId: string) {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: memberSelect },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
      tasks: {
        include: { assignee: memberSelect, createdBy: memberSelect },
        orderBy: [{ status: "asc" }, { dueAt: "asc" }],
      },
      resources: {
        where: { deletedAt: null },
        include: { uploader: memberSelect },
        orderBy: { createdAt: "desc" },
      },
      joinRequests: {
        where: { status: "PENDING" },
        include: { user: memberSelect },
        orderBy: { createdAt: "asc" },
      },
      deletionVotes: {
        where: { status: "OPEN" },
        include: { ballots: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!group) return null;

  const totalTasks = group.tasks.length;
  const completedTasks = group.tasks.filter((t) => t.status === "COMPLETED").length;
  const progressPct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return { ...group, progressPct, completedTasks, totalTasks };
}

export type GroupDashboard = NonNullable<Awaited<ReturnType<typeof getGroupDashboard>>>;

export async function getGroupActivity(groupId: string, limit = 30) {
  return db.groupActivity.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: memberSelect },
  });
}
