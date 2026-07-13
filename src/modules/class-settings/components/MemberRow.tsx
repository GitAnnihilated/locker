"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/ui/components/Avatar";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import {
  removeMember,
  promoteModerator,
  demoteModerator,
  transferClassOwnership,
} from "@/core/membership/actions";
import type { Role } from "@prisma/client";

export function MemberRow({
  classId,
  member,
  viewerIsFounder,
}: {
  classId: string;
  member: {
    userId: string;
    role: Role;
    user: { id: string; name: string | null; email: string; image: string | null };
  };
  viewerIsFounder: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1 border-b border-border px-4 py-3 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={member.user.name} image={member.user.image} size={32} />
          <div>
            <p className="text-sm font-medium">{member.user.name ?? member.user.email}</p>
            <p className="text-xs text-subtle">{member.user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone={member.role === "FOUNDER" ? "accent" : member.role === "MODERATOR" ? "success" : "neutral"}>
            {member.role}
          </Badge>

          {viewerIsFounder && member.role !== "FOUNDER" && (
            <>
              {member.role === "MODERATOR" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const result = await demoteModerator(classId, member.userId);
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
                      const result = await promoteModerator(classId, member.userId);
                      setError(result?.error ?? null);
                    })
                  }
                >
                  Promote
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const result = await transferClassOwnership(classId, member.userId);
                    setError(result?.error ?? null);
                  })
                }
              >
                Make founder
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const result = await removeMember(classId, member.userId);
                    setError(result?.error ?? null);
                  })
                }
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
