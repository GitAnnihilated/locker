import { db } from "@/core/db/client";

/** Open tasks first (soonest due date first, undated last), then done ones. */
export async function getMyTasks(userId: string) {
  const [open, done] = await Promise.all([
    db.personalTask.findMany({
      where: { userId, done: false },
      orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    }),
    db.personalTask.findMany({
      where: { userId, done: true },
      orderBy: { completedAt: "desc" },
      take: 20,
    }),
  ]);
  return { open, done };
}
