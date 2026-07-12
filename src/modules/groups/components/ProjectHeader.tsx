"use client";

import { useState } from "react";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { relativeDay } from "@/lib/format";
import { STATUS_META } from "../meta";
import { EditProjectForm } from "./EditProjectForm";
import { ArchiveGroupButton } from "./ArchiveGroupButton";
import { LeaveGroupButton } from "./LeaveGroupButton";
import type { GroupDashboard } from "../queries";

export function ProjectHeader({
  group,
  canManage,
  canGovern,
  isMember = false,
}: {
  group: GroupDashboard;
  canManage: boolean;
  canGovern: boolean;
  /** Non-members see the same header on their preview — leaving only applies to members. */
  isMember?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const status = STATUS_META[group.status];
  const overdue = group.dueAt && new Date(group.dueAt) < new Date() && group.status !== "COMPLETED";

  if (editing) {
    return <EditProjectForm group={group} onDone={() => setEditing(false)} />;
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          {group.subject && <p className="text-sm text-subtle">{group.subject}</p>}
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
          {canGovern && <ArchiveGroupButton groupId={group.id} />}
          {isMember && <LeaveGroupButton groupId={group.id} isLeader={canGovern} />}
        </div>
      </div>

      {group.description && <p className="mt-3 text-sm">{group.description}</p>}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-subtle">
        {group.teacherName && <span>Teacher: {group.teacherName}</span>}
        {group.dueAt && (
          <span className={overdue ? "font-medium text-danger" : undefined}>
            {relativeDay(group.dueAt)}
          </span>
        )}
      </div>
    </div>
  );
}
