"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Select, Textarea } from "@/ui/components/Input";
import { RESOURCE_TYPE_META } from "../meta";
import { addResource } from "../actions";
import type { ResourceType } from "@prisma/client";

export function ResourceForm({ groupId }: { groupId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={ref}
      action={(fd) =>
        start(async () => {
          setError(null);
          try {
            const result = await addResource(groupId, fd);
            if (result?.error) {
              setError(result.error);
              return;
            }
            ref.current?.reset();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
          }
        })
      }
      className="space-y-2 border-t border-border p-4"
    >
      <div className="flex gap-2">
        <Input name="title" placeholder="Title" required className="flex-1" />
        <Select name="type" defaultValue="LINK" className="w-44">
          {(Object.keys(RESOURCE_TYPE_META) as ResourceType[]).map((t) => (
            <option key={t} value={t}>
              {RESOURCE_TYPE_META[t].icon} {RESOURCE_TYPE_META[t].label}
            </option>
          ))}
        </Select>
      </div>
      <Input name="url" type="url" placeholder="https://…" required />
      <Textarea name="description" placeholder="Description (optional)" />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Sharing…" : "Share resource"}
      </Button>
    </form>
  );
}
