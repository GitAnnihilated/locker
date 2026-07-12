import { db } from "@/core/db/client";

/**
 * Internal helper — not a Server Action. Called from within other modules'
 * server actions (e.g. a deletion vote starting, a join request accepted)
 * to fan out a notification to one or more users.
 */
export async function notifyUsers(
  userIds: string[],
  data: { type: string; message: string; link?: string; metadata?: object },
) {
  if (userIds.length === 0) return;
  await db.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: data.type,
      message: data.message,
      link: data.link,
      metadata: data.metadata,
    })),
  });
}
