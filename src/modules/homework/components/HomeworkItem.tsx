"use client";

import { useTransition } from "react";
import { Badge } from "@/ui/components/Badge";
import { Avatar } from "@/ui/components/Avatar";
import { Button } from "@/ui/components/Button";
import { relativeDay } from "@/lib/format";
import { cn } from "@/lib/cn";
import { toggleDone, confirmHomework, removeHomework } from "../actions";
import type { HomeworkBoardItem } from "../queries";

export function HomeworkItem({
  item,
  canManage = false,
}: {
  item: HomeworkBoardItem;
  /** Class Founder or Moderator — can take down a spam/wrong entry. */
  canManage?: boolean;
}) {
  const [pending, start] = useTransition();

  const overdue =
    item.dueAt && new Date(item.dueAt) < new Date() && !item.done;

  return (
    <div
      className={cn(
        "flex items-start gap-3 border-b border-border px-5 py-4 last:border-0",
        pending && "opacity-60",
      )}
    >
      <button
        aria-label={item.done ? "Mark not done" : "Mark done"}
        onClick={() => start(() => toggleDone(item.id, !item.done))}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
          item.done
            ? "border-success bg-success text-white"
            : "border-border hover:border-accent",
        )}
      >
        {item.done && "✓"}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "truncate font-medium",
              item.done && "text-subtle line-through",
            )}
          >
            {item.title}
          </p>
          {item.subject && <Badge tone="accent">{item.subject}</Badge>}
        </div>
        {item.description && (
          <p className="mt-0.5 truncate text-sm text-subtle">
            {item.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-3 text-xs text-subtle">
          <span className={cn(overdue && "font-medium text-danger")}>
            {relativeDay(item.dueAt)}
          </span>
          <span className="flex items-center gap-1">
            <Avatar name={item.author.name} image={item.author.image} size={18} />
            added it
          </span>
          {item.confirmations >= 2 ? (
            <Badge tone="success">Confirmed x{item.confirmations}</Badge>
          ) : (
            <button
              onClick={() => start(() => confirmHomework(item.id))}
              className="font-medium text-accent hover:underline"
            >
              Confirm it's real
            </button>
          )}
          {canManage && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto h-6 px-2 text-danger"
              onClick={() => {
                if (!confirm(`Remove "${item.title}"?`)) return;
                start(() => removeHomework(item.id));
              }}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
