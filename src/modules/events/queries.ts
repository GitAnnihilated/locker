import { db } from "@/core/db/client";
import { cosmeticPerksSelect, withCosmetics } from "@/core/rewards/cosmetics";

/** Upcoming events at the student's school (college), with the viewer's RSVP state. */
export async function getUpcomingEvents(schoolId: string, viewerId: string) {
  const events = await db.event.findMany({
    where: { schoolId, deletedAt: null, startAt: { gte: new Date() } },
    orderBy: { startAt: "asc" },
    take: 100,
    include: {
      organizer: { select: { id: true, name: true, perks: cosmeticPerksSelect } },
      club: { select: { id: true, name: true } },
      class: { select: { id: true, name: true, courseCode: true } },
      attendees: { where: { userId: viewerId }, select: { id: true } },
      _count: { select: { attendees: true } },
    },
  });
  return events.map((e) => ({
    ...e,
    organizer: withCosmetics(e.organizer),
    attendeeCount: e._count.attendees,
    isAttending: e.attendees.length > 0,
  }));
}

export type UpcomingEvent = Awaited<ReturnType<typeof getUpcomingEvents>>[number];
