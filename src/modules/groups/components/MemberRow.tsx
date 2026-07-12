"use client";

import { useTransition } from "react";
import { Avatar } from "@/ui/components/Avatar";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { ROLE_META } from "../meta";
import {
  promoteCoLeader,
  demoteCoLeader,
  transferLeadership,
  removeMember,
} from "../actions";
import type { GroupDashboard } from "../queries";

export function MemberRow({
  groupId,
  member,
  viewerIsLeader,
}: {
  groupId: string;
  member: GroupDashboard["members"][number];
  viewerIsLeader: boolean;
}) {
  const [pending, start] = useTransition();
  const name = member.user.nickname || member.user.name || "Member";
  const tone = member.role === "LEADER" ? "accent" : member.role === "CO_LEADER" ? "success" : "neutral";

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <Avatar name={name} image={member.user.image} size={32} />
        <p className="text-sm font-medium">{name}</p>
      </div>

      <div className="flex items-center gap-2">
        <Badge tone={tone}>{ROLE_META[member.role].label}</Badge>

        {viewerIsLeader && member.role !== "LEADER" && (
          <>
            {member.role === "CO_LEADER" ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => start(() => demoteCoLeader(groupId, member.userId))}
              >
                Demote
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => start(() => promoteCoLeader(groupId, member.userId))}
              >
                Make Co-Leader
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => {
                if (!confirm(`Make ${name} the Leader? You'll become a Co-Leader.`)) return;
                start(() => transferLeadership(groupId, member.userId));
              }}
            >
              Make Leader
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={pending}
              onClick={() => {
                if (!confirm(`Remove ${name} from the project?`)) return;
                start(() => removeMember(groupId, member.userId));
              }}
            >
              Remove
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
