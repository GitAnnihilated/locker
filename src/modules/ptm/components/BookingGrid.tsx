"use client";

import { useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { bookPTMSlot, cancelPTMBooking } from "../actions";

type Slot = {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED" | "CANCELLED";
  booking: { bookedBy: { id: string; name: string } } | null;
};

/** Student/parent-proxy booking view — one button per slot, disabled once booked by someone else. */
export function BookingGrid({ slots, currentUserId }: { slots: Slot[]; currentUserId: string }) {
  const [pending, start] = useTransition();

  if (slots.length === 0) {
    return <p className="text-sm text-subtle">No open slots right now — check back later.</p>;
  }

  const byDate = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = new Date(slot.date).toDateString();
    byDate.set(key, [...(byDate.get(key) ?? []), slot]);
  }

  return (
    <div className="space-y-4">
      {Array.from(byDate.entries()).map(([date, daySlots]) => (
        <div key={date}>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-subtle">{date}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {daySlots.map((slot) => {
              const mine = slot.booking?.bookedBy.id === currentUserId;
              return (
                <Button
                  key={slot.id}
                  size="sm"
                  variant={slot.status === "AVAILABLE" ? "secondary" : mine ? "primary" : "ghost"}
                  disabled={pending || (slot.status === "BOOKED" && !mine)}
                  onClick={() =>
                    start(async () => {
                      if (mine) await cancelPTMBooking(slot.id);
                      else await bookPTMSlot(slot.id);
                    })
                  }
                >
                  {slot.startTime}
                  {mine ? " ✓" : slot.status === "BOOKED" ? " — taken" : ""}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
