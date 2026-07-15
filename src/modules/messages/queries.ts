import { db } from "@/core/db/client";

const authorSelect = { select: { id: true, name: true, nickname: true, image: true } } as const;

/** All distinct schools a user belongs to, via their class memberships. */
export async function getUserSchoolIds(userId: string): Promise<string[]> {
  const rows = await db.membership.findMany({
    where: { userId },
    select: { schoolId: true },
    distinct: ["schoolId"],
  });
  return rows.map((r) => r.schoolId);
}

/**
 * Every conversation the user's part of, newest activity first, with the
 * other participant, a last-message preview, and an unread flag derived
 * from the viewer's own lastReadAt column — no separate read-receipts table.
 */
export async function getConversations(userId: string) {
  const conversations = await db.conversation.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    include: {
      user1: authorSelect,
      user2: authorSelect,
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return conversations
    .map((c) => {
      const isUser1 = c.user1Id === userId;
      const other = isUser1 ? c.user2 : c.user1;
      const lastReadAt = isUser1 ? c.user1LastReadAt : c.user2LastReadAt;
      const lastMessage = c.messages[0] ?? null;
      const unread = !!lastMessage && lastMessage.senderId !== userId && (!lastReadAt || lastMessage.createdAt > lastReadAt);
      return {
        id: c.id,
        other,
        lastMessage,
        unread,
        sortAt: lastMessage?.createdAt ?? c.createdAt,
      };
    })
    .sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime());
}

export type ConversationSummary = Awaited<ReturnType<typeof getConversations>>[number];

/** Verifies the viewer is a participant before returning anything. */
export async function getConversationForViewer(conversationId: string, userId: string) {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: { user1: authorSelect, user2: authorSelect },
  });
  if (!conversation || (conversation.user1Id !== userId && conversation.user2Id !== userId)) {
    return null;
  }
  const other = conversation.user1Id === userId ? conversation.user2 : conversation.user1;
  return { id: conversation.id, other };
}

/** Verifies the viewer is a participant before returning anything. */
export async function getConversationMessages(conversationId: string, userId: string) {
  const conversation = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || (conversation.user1Id !== userId && conversation.user2Id !== userId)) {
    return null;
  }

  const messages = await db.directMessage.findMany({
    where: { conversationId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { sender: authorSelect },
  });

  // Normalize to the shared ChatMessage shape (authorId/author, not
  // senderId/sender) so DMs can reuse the same ChatThread as Group Chat.
  return messages.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt,
    authorId: m.senderId,
    author: m.sender,
  }));
}

export type DirectChatMessage = NonNullable<Awaited<ReturnType<typeof getConversationMessages>>>[number];

/**
 * Search people to message, scoped to schools the searcher shares with
 * them — never returns anyone outside the searcher's own schools.
 */
export async function searchSchoolUsers(query: string, viewerId: string) {
  const q = query.trim();
  if (q.length < 1) return [];

  const schoolIds = await getUserSchoolIds(viewerId);
  if (schoolIds.length === 0) return [];

  const memberships = await db.membership.findMany({
    where: { schoolId: { in: schoolIds }, userId: { not: viewerId } },
    select: { userId: true },
    distinct: ["userId"],
  });
  const candidateIds = memberships.map((m) => m.userId);
  if (candidateIds.length === 0) return [];

  const users = await db.user.findMany({
    where: {
      id: { in: candidateIds },
      deletedAt: null,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { nickname: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, nickname: true, image: true },
    take: 20,
    orderBy: { name: "asc" },
  });

  return users;
}
