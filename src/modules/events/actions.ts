"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { getActiveMembership } from "@/core/membership/queries";
import { handleActionError } from "@/lib/actionError";

const eventSchema = z.object({
  title: z.string().trim().min(2, "Give it a title").max(120),
  description: z.string().max(1000).optional(),
  startAt: z.string().min(1, "Pick a date/time"),
  location: z.string().max(140).optional(),
});

/** Any student can post a campus event — same "no gatekeeping" stance as everything else here. */
export async function createEvent(formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const membership = await getActiveMembership(user.id);
    if (!membership) throw new Error("Join a course first");

    const parsed = eventSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      startAt: formData.get("startAt"),
      location: formData.get("location") || undefined,
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid event");

    const startAt = new Date(parsed.data.startAt);
    if (Number.isNaN(startAt.getTime())) throw new Error("Invalid date/time");

    await db.event.create({
      data: {
        schoolId: membership.schoolId,
        organizerId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        location: parsed.data.location,
        startAt,
      },
    });

    revalidatePath("/events");
  } catch (e) {
    return handleActionError(e);
  }
}

export async function rsvpEvent(eventId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await db.eventAttendee.upsert({
      where: { eventId_userId: { eventId, userId: user.id } },
      create: { eventId, userId: user.id },
      update: {},
    });
    revalidatePath("/events");
  } catch (e) {
    return handleActionError(e);
  }
}

export async function cancelRsvp(eventId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await db.eventAttendee.deleteMany({ where: { eventId, userId: user.id } });
    revalidatePath("/events");
  } catch (e) {
    return handleActionError(e);
  }
}
