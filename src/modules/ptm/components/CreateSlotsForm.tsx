"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Label, Select } from "@/ui/components/Input";
import { createPTMSlots } from "../actions";

const SLOT_LENGTHS = [10, 15, 20, 30];

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Teacher-only — batch-generates fixed-length AVAILABLE slots across a
 * time window. The "student name" field only appears once the window
 * produces exactly one slot — labeling several slots with the same name
 * would be a mistake (see createPTMSlots's comment), not a real use case,
 * so it's a single-slot reservation shortcut rather than a batch field.
 */
export function CreateSlotsForm({ classId }: { classId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [slotLength, setSlotLength] = useState("10");
  const formRef = useRef<HTMLFormElement>(null);

  const isSingleSlot = useMemo(() => {
    const s = toMinutes(startTime);
    const e = toMinutes(endTime);
    const len = Number(slotLength);
    return s != null && e != null && len > 0 && e - s === len;
  }, [startTime, endTime, slotLength]);

  return (
    <form
      ref={formRef}
      action={(fd) =>
        start(async () => {
          setError(null);
          const result = await createPTMSlots(classId, fd);
          if (result?.error) setError(result.error);
          else formRef.current?.reset();
        })
      }
      className="grid gap-3 sm:grid-cols-4"
    >
      <div>
        <Label htmlFor="date">Date</Label>
        <Input id="date" name="date" type="date" required />
      </div>
      <div>
        <Label htmlFor="startTime">Start</Label>
        <Input
          id="startTime"
          name="startTime"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="endTime">End</Label>
        <Input
          id="endTime"
          name="endTime"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="slotLength">Slot length</Label>
        <Select
          id="slotLength"
          name="slotLength"
          value={slotLength}
          onChange={(e) => setSlotLength(e.target.value)}
          required
        >
          {SLOT_LENGTHS.map((n) => (
            <option key={n} value={n}>
              {n} min
            </option>
          ))}
        </Select>
      </div>
      {isSingleSlot && (
        <div className="sm:col-span-4">
          <Label htmlFor="reservedFor">Student name (optional)</Label>
          <Input id="reservedFor" name="reservedFor" placeholder="e.g. Aarav Shah" />
          <p className="mt-1 text-xs text-faint">
            Labels this one slot so you remember who it's for — doesn't stop anyone else from booking it.
          </p>
        </div>
      )}
      <div className="sm:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create slots"}
        </Button>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>
    </form>
  );
}
