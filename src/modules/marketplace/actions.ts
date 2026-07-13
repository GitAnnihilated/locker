"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { getActiveMembership } from "@/core/membership/queries";
import { handleActionError } from "@/lib/actionError";

const listingSchema = z.object({
  title: z.string().min(2).max(140),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().min(0).max(100000), // dollars from the form
});

export async function createListing(formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const membership = await getActiveMembership(user.id);
    if (!membership) throw new Error("Join a class first");

    const parsed = listingSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      price: formData.get("price"),
    });
    if (!parsed.success) throw new Error("Invalid listing");

    await db.marketplaceListing.create({
      data: {
        schoolId: membership.schoolId,
        sellerId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        priceCents: Math.round(parsed.data.price * 100), // store integer cents
      },
    });

    revalidatePath("/marketplace");
  } catch (e) {
    return handleActionError(e);
  }
}
