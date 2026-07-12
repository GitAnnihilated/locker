"use client";

import { useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Label, Select, Textarea } from "@/ui/components/Input";
import { STATUS_META } from "../meta";
import { updateProjectDetails, updateProjectStatus } from "../actions";
import type { GroupDashboard } from "../queries";

const EDITABLE_STATUSES = ["UPCOMING", "IN_PROGRESS", "COMPLETED"] as const;

export function EditProjectForm({ group, onDone }: { group: GroupDashboard; onDone: () => void }) {
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          id="status"
          defaultValue={group.status}
          disabled={pending}
          onChange={(e) =>
            start(() => updateProjectStatus(group.id, e.target.value as (typeof EDITABLE_STATUSES)[number]))
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
            await updateProjectDetails(group.id, fd);
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
