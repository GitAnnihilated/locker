"use client";

import { useState, useTransition } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const name = member.user.nickname || member.user.name || "Member";
  const tone = member.role === "LEADER" ? "accent" : member.role === "CO_LEADER" ? "success" : "neutral";

  return (
    <div className="flex flex-col gap-1 border-b border-border px-4 py-3 last:border-0">
      <div className="flex items-center justify-between gap-3">
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
                  onClick={() =>
                    start(async () => {
                      const result = await demoteCoLeader(groupId, member.userId);
                      setError(result?.error ?? null);
                    })
                  }
                >
                  Demote
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const result = await promoteCoLeader(groupId, member.userId);
                      setError(result?.error ?? null);
                    })
                  }
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
                  start(async () => {
                    const result = await transferLeadership(groupId, member.userId);
                    setError(result?.error ?? null);
                  });
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
                  start(async () => {
                    const result = await removeMember(groupId, member.userId);
                    setError(result?.error ?? null);
                  });
                }}
              >
                Remove
              </Button>
            </>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
