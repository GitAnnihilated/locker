"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { handleActionError } from "@/lib/actionError";
import { cosmeticPerksSelect, withCosmetics } from "@/core/rewards/cosmetics";

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
 * Course-specific discussion — deliberately separate from Group Chat and
 * DMs (see prisma/schema.prisma's ClassMessage). Same shape and polling
 * approach as Group Chat on purpose: no websocket infra in this app, so a
 * bounded ~3s poll is the honest cost, not new always-on infrastructure.
 */
export async function getClassMessages(classId: string) {
  const user = await requireUser();
  const membership = await db.membership.findUnique({ where: { userId_classId: { userId: user.id, classId } } });
  if (!membership) throw new Error("You're not enrolled in this course.");

  const messages = await db.classMessage.findMany({
    where: { classId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { author: memberSelect },
  });

  return messages.map(withCosmeticAuthor);
}

export type ClassChatMessage = Awaited<ReturnType<typeof getClassMessages>>[number];

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export async function sendClassMessage(
  classId: string,
  content: string,
): Promise<{ message: ClassChatMessage } | { error: string }> {
  try {
    const user = await requireUser();
    const membership = await db.membership.findUnique({ where: { userId_classId: { userId: user.id, classId } } });
    if (!membership) return { error: "You're not enrolled in this course." };

    const parsed = messageSchema.safeParse({ content });
    if (!parsed.success) {
      return { error: "Message can't be empty or over 2000 characters." };
    }

    const created = await db.classMessage.create({
      data: { classId, authorId: user.id, content: parsed.data.content },
      include: { author: memberSelect },
    });

    revalidatePath(`/courses/${classId}`);

    return { message: withCosmeticAuthor(created) };
  } catch (e) {
    return handleActionError(e);
  }
}
