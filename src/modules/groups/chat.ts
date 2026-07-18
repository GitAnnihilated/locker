"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { handleActionError } from "@/lib/actionError";
import { awardPoints } from "@/core/rewards/engine";
import { cosmeticPerksSelect, withCosmetics } from "@/core/rewards/cosmetics";
import { requireMembership } from "./actions";

const memberSelect = {
  select: {
    id: true,
    name: true,
    nickname: true,
    image: true,
    perks: cosmeticPerksSelect,
  },
} as const;

function withCosmeticAuthor<T extends { author: Parameters<typeof withCosmetics>[0] }>(row: T) {
  return { ...row, author: withCosmetics(row.author) };
}

/**
 * In-project chat, scoped to Group Finder only. Polled from the client
 * (~3s) rather than pushed — this app has no websocket/realtime infra, so
 * that's an honest, bounded cost instead of new always-on infrastructure.
 * Any current member can read and send; there's no role gate here, chat is
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

  return messages.map(withCosmeticAuthor);
}

export type GroupChatMessage = Awaited<ReturnType<typeof getGroupMessages>>[number];

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

/**
 * Returns the created message (with author info already joined) so the
 * client can swap its optimistic bubble for the real one without waiting on
 * the next poll tick. Returns `{ error }` instead of throwing for expected
 * failures — Next.js redacts thrown Server Action errors down to a generic
 * message in production, and the client needs the real text for its toast.
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

    const created = await db.groupMessage.create({
      data: { groupId, authorId: user.id, content: parsed.data.content },
      include: { author: memberSelect },
    });

    await awardPoints(user.id, "group_participation", groupId);

    // Only revalidates the sender's own next navigation — other members pick
    // up new messages via the client-side poll, not this.
    revalidatePath(`/groups/${groupId}`);

    return { message: withCosmeticAuthor(created) };
  } catch (e) {
    return handleActionError(e);
  }
}
