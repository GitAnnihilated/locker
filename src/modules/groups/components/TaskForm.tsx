"use client";

import { useRef, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Select } from "@/ui/components/Input";
import { createTask } from "../actions";
import type { GroupDashboard } from "../queries";

export function TaskForm({
  groupId,
  members,
}: {
  groupId: string;
  members: GroupDashboard["members"];
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();

  return (
    <form
      ref={ref}
      action={(fd) =>
        start(async () => {
          await createTask(groupId, fd);
          ref.current?.reset();
        })
      }
      className="space-y-2 border-t border-border p-4"
    >
      <div className="flex gap-2">
        <Input name="title" placeholder="New task…" required className="flex-1" />
        <Select name="assigneeId" defaultValue="" className="w-40">
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.user.nickname || m.user.name}
            </option>
          ))}
        </Select>
        <Input name="dueAt" type="date" className="w-40" />
        <Button type="submit" disabled={pending}>
          Add
        </Button>
      </div>
    </form>
  );
}
