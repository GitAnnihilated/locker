"use client";

import { useTransition } from "react";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { deleteStudentNote } from "../actions";

const CATEGORY_TONE: Record<string, "accent" | "warning" | "success" | "neutral"> = {
  GENERAL: "neutral",
  BEHAVIOR: "warning",
  PARTICIPATION: "accent",
  HOMEWORK: "warning",
  ACHIEVEMENT: "success",
};

type Note = {
  id: string;
  category: string;
  content: string;
  createdAt: Date;
  author: { id: string; name: string };
};

export function NoteList({ notes, currentUserId }: { notes: Note[]; currentUserId: string }) {
  const [pending, start] = useTransition();

  if (notes.length === 0) {
    return <p className="text-sm text-subtle">No notes yet — the first one you add shows up here.</p>;
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li key={note.id} className="rounded-lg border border-border p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge tone={CATEGORY_TONE[note.category] ?? "neutral"}>{note.category}</Badge>
              <span className="text-xs text-faint">
                {new Date(note.createdAt).toLocaleDateString()} · {note.author.name}
              </span>
            </div>
            {note.author.id === currentUserId && (
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => start(async () => { await deleteStudentNote(note.id); })}
              >
                Remove
              </Button>
            )}
          </div>
          <p className="mt-2 text-sm">{note.content}</p>
        </li>
      ))}
    </ul>
  );
}
