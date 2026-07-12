"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";

export async function markNotificationRead(notificationId: string) {
  const user = await requireUser();
  await db.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { read: true },
  });
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/", "layout");
}
