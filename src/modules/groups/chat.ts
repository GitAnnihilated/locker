"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { requireMembership } from "./actions";

const memberSelect = {
  select: { id: true, name: true, nickname: true, image: true },
} as const;

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

  return messages;
}

export type GroupChatMessage = Awaited<ReturnType<typeof getGroupMessages>>[number];

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export async function sendGroupMessage(groupId: string, formData: FormData) {
  const user = await requireUser();
  await requireMembership(groupId, user.id);

  const parsed = messageSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) return; // empty/too-long — just drop it, no need to surface a form error for chat

  await db.groupMessage.create({
    data: { groupId, authorId: user.id, content: parsed.data.content },
  });

  // Only revalidates the sender's own next navigation — other members pick
  // up new messages via the client-side poll, not this.
  revalidatePath(`/groups/${groupId}`);
}
