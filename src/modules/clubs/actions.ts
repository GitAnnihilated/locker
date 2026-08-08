"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { getActiveMembership } from "@/core/membership/queries";
import { handleActionError } from "@/lib/actionError";
import { awardPoints } from "@/core/rewards/engine";

const clubSchema = z.object({
  name: z.string().trim().min(2, "Name it").max(80),
  description: z.string().max(1000).optional(),
  category: z.string().max(40).optional(),
});

/** Same "no gatekeeping" stance as School/Class — whoever starts a club owns it outright. */
export async function createClub(formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const membership = await getActiveMembership(user.id);
    if (!membership) throw new Error("Join a course first");

    const parsed = clubSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      category: formData.get("category") || undefined,
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid club");

    const club = await db.club.create({
      data: {
        schoolId: membership.schoolId,
        founderId: user.id,
        name: parsed.data.name,
        description: parsed.data.description,
        category: parsed.data.category,
        members: { create: { userId: user.id, role: "ORGANIZER" } },
      },
    });

    await awardPoints(user.id, "club_created", club.id);

    revalidatePath("/clubs");
    return undefined;
  } catch (e) {
    return handleActionError(e);
  }
}

export async function joinClub(clubId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await db.clubMember.upsert({
      where: { clubId_userId: { clubId, userId: user.id } },
      create: { clubId, userId: user.id },
      update: {},
    });

    await awardPoints(user.id, "club_joined", clubId);

    revalidatePath("/clubs");
    revalidatePath(`/clubs/${clubId}`);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function leaveClub(clubId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const club = await db.club.findUnique({ where: { id: clubId }, select: { founderId: true } });
    if (club?.founderId === user.id) {
      throw new Error("The founder can't leave — transfer or archive the club first.");
    }
    await db.clubMember.deleteMany({ where: { clubId, userId: user.id } });
    revalidatePath("/clubs");
    revalidatePath(`/clubs/${clubId}`);
  } catch (e) {
    return handleActionError(e);
  }
}
