"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Label, Select, Textarea } from "@/ui/components/Input";
import { STATUS_META } from "../meta";
import { updateProjectDetails, updateProjectStatus } from "../actions";
import type { GroupDashboard } from "../queries";

const EDITABLE_STATUSES = ["UPCOMING", "IN_PROGRESS", "COMPLETED"] as const;

export function EditProjectForm({ group, onDone }: { group: GroupDashboard; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          id="status"
          defaultValue={group.status}
          disabled={pending}
          onChange={(e) =>
            start(async () => {
              const result = await updateProjectStatus(group.id, e.target.value as (typeof EDITABLE_STATUSES)[number]);
              setError(result?.error ?? null);
            })
          }
        >
          {EDITABLE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </Select>
      </div>

      <form
        action={(fd) =>
          start(async () => {
            const result = await updateProjectDetails(group.id, fd);
            if (result?.error) {
              setError(result.error);
              return;
            }
            onDone();
          })
        }
        className="space-y-3"
      >
        <div>
          <Label htmlFor="name">Project name</Label>
          <Input id="name" name="name" defaultValue={group.name} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" defaultValue={group.subject ?? ""} />
          </div>
          <div>
            <Label htmlFor="dueAt">Due date</Label>
            <Input
              id="dueAt"
              name="dueAt"
              type="date"
              defaultValue={group.dueAt ? new Date(group.dueAt).toISOString().slice(0, 10) : ""}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="teacherName">Teacher</Label>
          <Input id="teacherName" name="teacherName" defaultValue={group.teacherName ?? ""} />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" defaultValue={group.description ?? ""} />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="flex-1">
            {pending ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
