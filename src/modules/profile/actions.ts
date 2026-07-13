"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { handleActionError } from "@/lib/actionError";
import { updateProfileSchema } from "./schema";

export async function updateProfile(formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();

    const parsed = updateProfileSchema.safeParse({
      name: formData.get("name"),
      nickname: formData.get("nickname") || undefined,
      bio: formData.get("bio") || undefined,
      image: formData.get("image") || "",
    });
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name,
        nickname: parsed.data.nickname,
        bio: parsed.data.bio,
        image: parsed.data.image || null,
      },
    });

    revalidatePath("/profile");
  } catch (e) {
    return handleActionError(e);
  }
}
