"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/ui/components/Modal";
import { Button } from "@/ui/components/Button";
import { Input, Label, Textarea } from "@/ui/components/Input";
import { Avatar } from "@/ui/components/Avatar";
import { createGroup } from "../actions";
import { isRedirectError } from "@/lib/isRedirectError";
import type { ClassGroup } from "../queries";

/**
 * Combines the spec's "verify no duplicate exists" confirmation with the
 * actual data needed to verify it — the existing groups are shown right
 * here, so "please check" is something the student can actually do instead
 * of a warning they click past.
 */
export function CreateGroupDialog({ existingGroups }: { existingGroups: ClassGroup[] }) {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setConfirmed(false);
    setError(null);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>New Project</Button>

      <Modal open={open} onClose={close} title="Start a new project" className="max-w-lg">
        {!confirmed ? (
          <div className="space-y-4">
            <p className="text-sm text-subtle">
              Before creating a new project, please verify that another group
              with the same members and project doesn&apos;t already exist.
              Duplicate groups make collaboration confusing — if a similar
              one exists, consider joining it instead.
            </p>

            {existingGroups.length > 0 ? (
              <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border border-border p-2">
                {existingGroups.map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{g.name}</p>
                      {g.subject && <p className="text-xs text-subtle">{g.subject}</p>}
                    </div>
                    <div className="flex -space-x-2">
                      {g.members.slice(0, 4).map((m) => (
                        <Avatar
                          key={m.id}
                          name={m.user.nickname || m.user.name}
                          image={m.user.image}
                          size={20}
                          className="ring-2 ring-surface"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-md bg-muted px-3 py-2 text-sm text-subtle">
                No active projects in this class yet — you&apos;re first.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button onClick={() => setConfirmed(true)}>Create Group</Button>
            </div>
          </div>
        ) : (
          <form
            action={(fd) =>
              start(async () => {
                setError(null);
                try {
                  const result = await createGroup(fd);
                  if (result?.error) setError(result.error);
                } catch (e) {
                  if (isRedirectError(e)) throw e;
                  setError(e instanceof Error ? e.message : "Something went wrong");
                }
              })
            }
            className="space-y-3"
          >
            <div>
              <Label htmlFor="name">Project name</Label>
              <Input id="name" name="name" placeholder="e.g. Chemistry Lab Report" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" placeholder="Chemistry" />
              </div>
              <div>
                <Label htmlFor="dueAt">Due date</Label>
                <Input id="dueAt" name="dueAt" type="date" />
              </div>
            </div>
            <div>
              <Label htmlFor="teacherName">Teacher (optional)</Label>
              <Input id="teacherName" name="teacherName" placeholder="Mrs. Sharma" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="What's the project about?" />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setConfirmed(false)}>
                Back
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Creating…" : "Create project"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
