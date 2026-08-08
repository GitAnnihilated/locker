"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Textarea, Label } from "@/ui/components/Input";
import { createEvent } from "../actions";

export function CreateEventForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={ref}
      action={(fd) =>
        start(async () => {
          const result = await createEvent(fd);
          if (result?.error) {
            setError(result.error);
            return;
          }
          setError(null);
          ref.current?.reset();
        })
      }
      className="space-y-3"
    >
      <div>
        <Label htmlFor="title">Event title</Label>
        <Input id="title" name="title" placeholder="e.g. Spring Hackathon" required />
      </div>
      <div>
        <Label htmlFor="startAt">Date & time</Label>
        <Input id="startAt" name="startAt" type="datetime-local" required />
      </div>
      <div>
        <Label htmlFor="location">Location (optional)</Label>
        <Input id="location" name="location" placeholder="e.g. Student Union, Room 204" />
      </div>
      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" name="description" placeholder="What's happening?" />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Posting…" : "Post event"}
      </Button>
    </form>
  );
}
