"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Label, Select } from "@/ui/components/Input";
import { createPTMSlots } from "../actions";

const SLOT_LENGTHS = [10, 15, 20, 30];

/** Teacher-only — batch-generates fixed-length AVAILABLE slots across a time window. */
export function CreateSlotsForm({ classId }: { classId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
        <Input id="startTime" name="startTime" type="time" required />
      </div>
      <div>
        <Label htmlFor="endTime">End</Label>
        <Input id="endTime" name="endTime" type="time" required />
      </div>
      <div>
        <Label htmlFor="slotLength">Slot length</Label>
        <Select id="slotLength" name="slotLength" defaultValue="10" required>
          {SLOT_LENGTHS.map((n) => (
            <option key={n} value={n}>
              {n} min
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create slots"}
        </Button>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>
    </form>
  );
}
