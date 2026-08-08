"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Textarea, Label } from "@/ui/components/Input";
import { createClub } from "../actions";

export function CreateClubForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={ref}
      action={(fd) =>
        start(async () => {
          const result = await createClub(fd);
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
        <Label htmlFor="name">Club name</Label>
        <Input id="name" name="name" placeholder="e.g. Robotics Club" required />
      </div>
      <div>
        <Label htmlFor="category">Category (optional)</Label>
        <Input id="category" name="category" placeholder="e.g. Tech, Sports, Arts" />
      </div>
      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" name="description" placeholder="What does this club do?" />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating…" : "Create club"}
      </Button>
    </form>
  );
}
