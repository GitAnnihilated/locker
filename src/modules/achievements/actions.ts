"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { achievementSchema } from "./schema";

function parseAchievementForm(formData: FormData) {
  const parsed = achievementSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    description: formData.get("description") || undefined,
    level: formData.get("level"),
    achievedOn: formData.get("achievedOn"),
    certificateUrl: formData.get("certificateUrl") || "",
    photoUrl: formData.get("photoUrl") || "",
    link: formData.get("link") || "",
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid achievement");
  }
  return parsed.data;
}

export async function createAchievement(formData: FormData) {
  const user = await requireUser();
  const data = parseAchievementForm(formData);

  await db.achievement.create({
    data: {
      userId: user.id,
      title: data.title,
      category: data.category,
      description: data.description,
      level: data.level,
      achievedOn: new Date(data.achievedOn),
      certificateUrl: data.certificateUrl || null,
      photoUrl: data.photoUrl || null,
      link: data.link || null,
      visibility: data.visibility,
    },
  });

  revalidatePath("/achievements");
  revalidatePath("/profile");
}

export async function updateAchievement(achievementId: string, formData: FormData) {
  const user = await requireUser();
  const data = parseAchievementForm(formData);

  await db.achievement.updateMany({
    where: { id: achievementId, userId: user.id }, // scoped to the owner — no one else can edit
    data: {
      title: data.title,
      category: data.category,
      description: data.description,
      level: data.level,
      achievedOn: new Date(data.achievedOn),
      certificateUrl: data.certificateUrl || null,
      photoUrl: data.photoUrl || null,
      link: data.link || null,
      visibility: data.visibility,
    },
  });

  revalidatePath("/achievements");
  revalidatePath("/profile");
}

export async function deleteAchievement(achievementId: string) {
  const user = await requireUser();

  await db.achievement.updateMany({
    where: { id: achievementId, userId: user.id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/achievements");
  revalidatePath("/profile");
}
