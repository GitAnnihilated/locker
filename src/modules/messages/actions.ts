"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { handleActionError } from "@/lib/actionError";
import {
  getUserSchoolIds,
  searchSchoolUsers as searchSchoolUsersQuery,
  getConversationMessages as getConversationMessagesQuery,
} from "./queries";
import type { DirectChatMessage } from "./queries";

/**
 * Exposed as Server Actions (not plain queries) specifically so client
 * components — the "New message" picker and the DM thread's polling loop —
 * can call them directly without an API route. queries.ts imports Prisma
 * directly, so it can only ever be called from server code; these are the
 * client-safe entry points.
 */
export async function searchSchoolUsers(query: string) {
  const user = await requireUser();
  return searchSchoolUsersQuery(query, user.id);
}

export async function getConversationMessages(conversationId: string) {
  const user = await requireUser();
  return (await getConversationMessagesQuery(conversationId, user.id)) ?? [];
}

/**
 * One conversation per unordered pair, enforced by @@unique([user1Id,
 * user2Id]) with a canonical (smaller-id-first) ordering — this both finds
 * an existing thread and creates one atomically via upsert, so two people
 * clicking "message" on each other at the same moment can't create two rows.
 */
export async function getOrCreateConversation(otherUserId: string) {
  try {
    const user = await requireUser();
    if (otherUserId === user.id) return { error: "You can't message yourself." };

    const [mySchools, otherSchools] = await Promise.all([
      getUserSchoolIds(user.id),
      getUserSchoolIds(otherUserId),
    ]);
    const sharesSchool = mySchools.some((id) => otherSchools.includes(id));
    if (!sharesSchool) {
      return { error: "You can only message people in your own school." };
    }

    const [user1Id, user2Id] = [user.id, otherUserId].sort();

    const conversation = await db.conversation.upsert({
      where: { user1Id_user2Id: { user1Id, user2Id } },
      create: { user1Id, user2Id },
      update: {},
    });

    redirect(`/messages/${conversation.id}`);
  } catch (e) {
    return handleActionError(e);
  }
}

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export async function sendDirectMessage(
  conversationId: string,
  content: string,
): Promise<{ message: DirectChatMessage } | { error: string }> {
  try {
    const user = await requireUser();

    const conversation = await db.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || (conversation.user1Id !== user.id && conversation.user2Id !== user.id)) {
      return { error: "Conversation not found." };
    }

    const parsed = messageSchema.safeParse({ content });
    if (!parsed.success) {
      return { error: "Message can't be empty or over 2000 characters." };
    }

    const created = await db.directMessage.create({
      data: { conversationId, senderId: user.id, content: parsed.data.content },
      include: { sender: { select: { id: true, name: true, nickname: true, image: true } } },
    });

    const message: DirectChatMessage = {
      id: created.id,
      content: created.content,
      createdAt: created.createdAt,
      authorId: created.senderId,
      author: created.sender,
    };

    return { message };
  } catch (e) {
    return handleActionError(e);
  }
}

/** Marks everything in the conversation read up to now, for the viewer's side only. */
export async function markConversationRead(conversationId: string) {
  try {
    const user = await requireUser();
    const conversation = await db.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return;
    if (conversation.user1Id !== user.id && conversation.user2Id !== user.id) return;

    const isUser1 = conversation.user1Id === user.id;
    await db.conversation.update({
      where: { id: conversationId },
      data: isUser1 ? { user1LastReadAt: new Date() } : { user2LastReadAt: new Date() },
    });
  } catch (e) {
    handleActionError(e);
  }
}
