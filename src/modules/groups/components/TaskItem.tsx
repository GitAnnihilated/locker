"use client";

import { useTransition } from "react";
import { Avatar } from "@/ui/components/Avatar";
import { Select } from "@/ui/components/Input";
import { Button } from "@/ui/components/Button";
import { cn } from "@/lib/cn";
import { relativeDay } from "@/lib/format";
import { TASK_STATUS_META } from "../meta";
import { updateTaskStatus, deleteTask } from "../actions";
import type { GroupDashboard } from "../queries";
import type { TaskStatus } from "@prisma/client";

export function TaskItem({
  task,
  canManage,
}: {
  task: GroupDashboard["tasks"][number];
  canManage: boolean;
}) {
  const [pending, start] = useTransition();
  const done = task.status === "COMPLETED";
  const overdue = task.dueAt && new Date(task.dueAt) < new Date() && !done;

  return (
    <div
      className={cn(
        "flex items-start gap-3 border-b border-border px-4 py-3 last:border-0",
        pending && "opacity-60",
      )}
    >
      <button
        aria-label={done ? "Mark not done" : "Mark done"}
        onClick={() =>
          start(() => updateTaskStatus(task.id, done ? "NOT_STARTED" : "COMPLETED"))
        }
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
          done ? "border-success bg-success text-white" : "border-border hover:border-accent",
        )}
      >
        {done && "✓"}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("font-medium", done && "text-subtle line-through")}>{task.title}</p>
        {task.description && <p className="mt-0.5 text-sm text-subtle">{task.description}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-subtle">
          <Select
            value={task.status}
            onChange={(e) =>
              start(() => updateTaskStatus(task.id, e.target.value as TaskStatus))
            }
            className="!h-7 w-auto py-0 text-xs"
          >
            {(Object.keys(TASK_STATUS_META) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_META[s].label}
              </option>
            ))}
          </Select>

          {task.dueAt && (
            <span className={overdue ? "font-medium text-danger" : undefined}>
              {relativeDay(task.dueAt)}
            </span>
          )}

          {task.assignee && (
            <span className="flex items-center gap-1">
              <Avatar
                name={task.assignee.nickname || task.assignee.name}
                image={task.assignee.image}
                size={18}
              />
              {task.assignee.nickname || task.assignee.name}
            </span>
          )}

          {canManage && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto h-6 px-2 text-danger"
              onClick={() => {
                if (!confirm("Delete this task?")) return;
                start(() => deleteTask(task.id));
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
