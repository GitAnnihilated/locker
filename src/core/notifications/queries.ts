import { db } from "@/core/db/client";

export async function getUnreadCount(userId: string) {
  return db.notification.count({ where: { userId, read: false } });
}

/** Recent notifications for the bell dropdown — read and unread, newest first. */
export async function getRecentNotifications(userId: string, limit = 15) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
