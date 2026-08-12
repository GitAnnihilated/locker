"use client";

import { useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { toggleTask, deleteTask } from "../actions";

type Task = { id: string; title: string; dueAt: Date | null; done: boolean };

export function TaskRow({ task }: { task: Task }) {
  const [pending, start] = useTransition();
  const overdue = !task.done && task.dueAt && new Date(task.dueAt) < new Date(new Date().toDateString());

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => { await toggleTask(task.id); })}
        aria-label={task.done ? "Mark not done" : "Mark done"}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-[10px] text-white ${
          task.done ? "border-success bg-success" : "border-border-strong"
        }`}
      >
        {task.done && "✓"}
      </button>
      <span className={`flex-1 text-sm ${task.done ? "text-faint line-through" : ""}`}>{task.title}</span>
      {task.dueAt && !task.done && (
        <span className={`text-xs ${overdue ? "text-danger" : "text-faint"}`}>
          {overdue ? "Overdue" : new Date(task.dueAt).toLocaleDateString()}
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => start(async () => { await deleteTask(task.id); })}
      >
        Remove
      </Button>
    </li>
  );
}
