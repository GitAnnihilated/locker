"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Textarea, Label } from "@/ui/components/Input";
import { createListing } from "../actions";

export function ListingForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={ref}
      action={(fd) =>
        start(async () => {
          const result = await createListing(fd);
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
        <Label htmlFor="title">Item</Label>
        <Input id="title" name="title" placeholder="Physics textbook (9th ed.)" required />
      </div>
      <div>
        <Label htmlFor="price">Price ($)</Label>
        <Input id="price" name="price" type="number" min="0" step="0.01" placeholder="15.00" required />
      </div>
      <div>
        <Label htmlFor="description">Details</Label>
        <Textarea id="description" name="description" placeholder="Condition, pickup spot…" />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Posting…" : "Post listing"}
      </Button>
    </form>
  );
}
