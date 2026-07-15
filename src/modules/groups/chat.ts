"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { handleActionError } from "@/lib/actionError";
import { requireMembership } from "./actions";

const memberSelect = {
  select: { id: true, name: true, nickname: true, image: true },
} as const;

/**
 * In-project chat, scoped to Group Finder only. Realtime via Supabase
 * Broadcast, fed by a Postgres trigger on insert (see
 * scripts/setup-realtime-broadcast.mjs) — this query is only used for the
 * initial load and to catch up after a reconnect, not on an interval. Any
 * current member can read and send; there's no role gate here, chat is
 * plain participation, not governance.
 */
export async function getGroupMessages(groupId: string) {
  const user = await requireUser();
  await requireMembership(groupId, user.id);

  const messages = await db.groupMessage.findMany({
    where: { groupId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { author: memberSelect },
  });

  return messages;
}

export type GroupChatMessage = Awaited<ReturnType<typeof getGroupMessages>>[number];

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

/**
 * Returns the created message (with author info already joined) so the
 * sender's own client can swap its optimistic bubble for the real one
 * immediately — everyone else's clients get it via the Realtime broadcast
 * the insert trigger fires. Returns `{ error }` instead of throwing for
 * expected failures — Next.js redacts thrown Server Action errors down to a
 * generic message in production, and the client needs the real text for
 * its toast.
 */
export async function sendGroupMessage(
  groupId: string,
  content: string,
): Promise<{ message: GroupChatMessage } | { error: string }> {
  try {
    const user = await requireUser();
    await requireMembership(groupId, user.id);

    const parsed = messageSchema.safeParse({ content });
    if (!parsed.success) {
      return { error: "Message can't be empty or over 2000 characters." };
    }

    const message = await db.groupMessage.create({
      data: { groupId, authorId: user.id, content: parsed.data.content },
      include: { author: memberSelect },
    });

    // Only revalidates the sender's own next navigation — other members get
    // the update via the Realtime broadcast, not this.
    revalidatePath(`/groups/${groupId}`);

    return { message };
  } catch (e) {
    return handleActionError(e);
  }
}
