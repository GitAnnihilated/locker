import { db } from "@/core/db/client";

/**
 * The class homework board, joined with THIS user's done/not-done status.
 * One query powers the whole board — no N+1.
 */
export async function getHomeworkBoard(classId: string, userId: string) {
  const items = await db.homework.findMany({
    where: { classId, deletedAt: null },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    include: {
      author: { select: { id: true, name: true, image: true } },
      statuses: { where: { userId }, select: { done: true } },
    },
  });

  return items.map((h) => ({
    id: h.id,
    title: h.title,
    description: h.description,
    subject: h.subject,
    dueAt: h.dueAt,
    author: h.author,
    confirmations: h.confirmations,
    done: h.statuses[0]?.done ?? false,
  }));
}

export type HomeworkBoardItem = Awaited<
  ReturnType<typeof getHomeworkBoard>
>[number];

/** Lightweight count for dashboard summary tiles — avoids fetching the full board. */
export async function getPendingHomeworkCount(classId: string, userId: string) {
  return db.homework.count({
    where: {
      classId,
      deletedAt: null,
      NOT: { statuses: { some: { userId, done: true } } },
    },
  });
}

/** Coverage meter: % of assignments confirmed by >=2 members (growth nudge). */
export async function getCoverage(classId: string) {
  const [total, confirmed] = await Promise.all([
    db.homework.count({ where: { classId, deletedAt: null } }),
    db.homework.count({
      where: { classId, deletedAt: null, confirmations: { gte: 2 } },
    }),
  ]);
  return { total, confirmed, pct: total ? Math.round((confirmed / total) * 100) : 0 };
}
