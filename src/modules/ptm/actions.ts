"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireUser } from "@/core/auth/session";
import { requireClassTeacher } from "@/core/permissions/guards";
import { handleActionError } from "@/lib/actionError";
import { generateTimeSlots } from "./slots";

const createSlotsSchema = z.object({
  date: z.string().min(1, "Choose a date"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid start time"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid end time"),
  slotLength: z.coerce.number().int().min(5).max(120),
  reservedFor: z.string().trim().max(120).optional(),
});

/**
 * Teacher-of-record only (requireClassTeacher — re-checked server-side every
 * call, never trusted from the client). Slices the given window into fixed
 * slots and inserts them all AVAILABLE. Re-running for a window that
 * overlaps an already-created slot is a no-op for those exact
 * (teacherId, date, startTime) rows — the @@unique constraint on PTMSlot
 * makes createMany's skipDuplicates the correct behavior, not an error.
 *
 * reservedFor is an optional plain-text label ("this slot is for Aarav
 * Shah") — see the schema comment on PTMSlot.reservedFor. When a window
 * produces multiple slots, the SAME label is applied to all of them,
 * since a real single-student reservation should be created with a
 * one-slot window (date/start/end matching slotLength exactly) — batching
 * several slots under one student's name would be a mistake, not a
 * feature, so the UI only shows the field once you're at a 1-slot window.
 */
export async function createPTMSlots(classId: string, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    await requireClassTeacher(user.id, classId);

    const parsed = createSlotsSchema.safeParse({
      date: formData.get("date"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      slotLength: formData.get("slotLength"),
      reservedFor: formData.get("reservedFor") || undefined,
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid slot window");

    const windows = generateTimeSlots(parsed.data.startTime, parsed.data.endTime, parsed.data.slotLength);
    if (windows.length === 0) throw new Error("That window is too short for even one slot");

    const date = new Date(parsed.data.date);
    if (Number.isNaN(date.getTime())) throw new Error("Invalid date");

    await db.pTMSlot.createMany({
      data: windows.map((w) => ({
        classId,
        teacherId: user.id,
        date,
        startTime: w.startTime,
        endTime: w.endTime,
        reservedFor: parsed.data.reservedFor || null,
      })),
      skipDuplicates: true,
    });

    revalidatePath("/ptm");
  } catch (e) {
    return handleActionError(e);
  }
}

/** Teacher-of-record only, and only while the slot is still AVAILABLE (never yanks a booked slot). */
export async function cancelPTMSlot(slotId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const slot = await db.pTMSlot.findUniqueOrThrow({ where: { id: slotId } });
    await requireClassTeacher(user.id, slot.classId);

    if (slot.status !== "AVAILABLE") {
      throw new Error("Only an open slot can be cancelled — cancel the booking first.");
    }

    await db.pTMSlot.update({ where: { id: slotId }, data: { status: "CANCELLED" } });
    revalidatePath("/ptm");
  } catch (e) {
    return handleActionError(e);
  }
}

/**
 * Any class member can book an open slot for their own class. The double-
 * booking guard is enforced at the DB level, not just in this check: the
 * status filter here narrows the common case, but PTMBooking.slotId being
 * @unique is what actually stops two concurrent requests from both winning
 * a race on the same slot — the loser's insert throws a unique-constraint
 * error, which we translate into a friendly message.
 */
export async function bookPTMSlot(slotId: string, formData?: FormData): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const slot = await db.pTMSlot.findUniqueOrThrow({ where: { id: slotId } });

    const membership = await db.membership.findUnique({
      where: { userId_classId: { userId: user.id, classId: slot.classId } },
    });
    if (!membership) throw new Error("You're not a member of this class");

    if (slot.status !== "AVAILABLE") {
      throw new Error("That slot is no longer available");
    }

    const note = formData ? String(formData.get("note") ?? "").trim().slice(0, 300) || null : null;

    try {
      await db.$transaction([
        db.pTMBooking.create({ data: { slotId, bookedById: user.id, note } }),
        db.pTMSlot.update({ where: { id: slotId, status: "AVAILABLE" }, data: { status: "BOOKED" } }),
      ]);
    } catch {
      throw new Error("That slot was just booked by someone else");
    }

    revalidatePath("/ptm");
  } catch (e) {
    return handleActionError(e);
  }
}

/** The person who booked it can free the slot back up. */
export async function cancelPTMBooking(slotId: string): Promise<{ error: string } | undefined> {
  try {
    const user = await requireUser();
    const slot = await db.pTMSlot.findUniqueOrThrow({ where: { id: slotId }, include: { booking: true } });
    if (!slot.booking || slot.booking.bookedById !== user.id) {
      throw new Error("Only the person who booked this slot can cancel it");
    }

    await db.$transaction([
      db.pTMBooking.delete({ where: { slotId } }),
      db.pTMSlot.update({ where: { id: slotId }, data: { status: "AVAILABLE" } }),
    ]);

    revalidatePath("/ptm");
  } catch (e) {
    return handleActionError(e);
  }
}
