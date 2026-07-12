"use client";

import { useRef, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { Input, Textarea, Label } from "@/ui/components/Input";
import { createHomework } from "../actions";

export function HomeworkForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();

  return (
    <form
      ref={formRef}
      action={(fd) =>
        start(async () => {
          await createHomework(fd);
          formRef.current?.reset();
        })
      }
      className="space-y-3"
    >
      <div>
        <Label htmlFor="title">Assignment</Label>
        <Input id="title" name="title" placeholder="e.g. Chapter 4 problems 1–10" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" name="subject" placeholder="Math" />
        </div>
        <div>
          <Label htmlFor="dueAt">Due date</Label>
          <Input id="dueAt" name="dueAt" type="date" />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Notes (optional)</Label>
        <Textarea id="description" name="description" placeholder="Anything classmates should know" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Adding…" : "Add to class board"}
      </Button>
    </form>
  );
}
