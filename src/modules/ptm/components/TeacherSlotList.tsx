"use client";

import { useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { cancelPTMSlot } from "../actions";

type Slot = {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED" | "CANCELLED";
  booking: { bookedBy: { name: string } } | null;
};

/** Grouped by date — one row per slot, cancel only offered while AVAILABLE. */
export function TeacherSlotList({ slots }: { slots: Slot[] }) {
  const [pending, start] = useTransition();

  if (slots.length === 0) {
    return <p className="text-sm text-subtle">No slots yet — create some above.</p>;
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
          <div className="divide-y divide-border rounded-md border border-border">
            {daySlots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="font-medium">
                  {slot.startTime}–{slot.endTime}
                </span>
                {slot.status === "BOOKED" ? (
                  <span className="text-xs text-subtle">Booked by {slot.booking?.bookedBy.name}</span>
                ) : slot.status === "CANCELLED" ? (
                  <span className="text-xs text-subtle">Cancelled</span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => start(async () => { await cancelPTMSlot(slot.id); })}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
