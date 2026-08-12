"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/ui/components/Avatar";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { CosmeticName } from "@/ui/components/CosmeticName";
import type { EquippedCosmetics } from "@/core/rewards/cosmetics";
import {
  removeMember,
  promoteModerator,
  demoteModerator,
  transferClassOwnership,
} from "@/core/membership/actions";
import type { Role } from "@prisma/client";

const ROLE_LABEL: Record<Role, string> = {
  FOUNDER: "Founder",
  MODERATOR: "Moderator",
  STUDENT: "Student",
  TEACHER: "Teacher",
};

export function MemberRow({
  classId,
  member,
  viewerIsFounder,
  isTeacherOwned,
}: {
  classId: string;
  member: {
    userId: string;
    role: Role;
    user: { id: string; name: string | null; email: string; image: string | null } & EquippedCosmetics;
  };
  viewerIsFounder: boolean;
  /** A SCHOOL class (Class.teacherId set) has a fixed teacher, not a
   * promotable/transferable Founder — see core/membership/actions.ts. */
  isTeacherOwned: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const roleLabel = isTeacherOwned && member.role === "FOUNDER" ? "Teacher" : ROLE_LABEL[member.role];

  return (
    <div className="flex flex-col gap-1 border-b border-border px-4 py-3 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={member.user.name} image={member.user.image} size={32} frame={member.user.avatarFrame} />
          <div>
            <p className="text-sm font-medium">
              <CosmeticName color={member.user.nameColor}>{member.user.name ?? member.user.email}</CosmeticName>
            </p>
            <p className="text-xs text-subtle">{member.user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone={member.role === "FOUNDER" ? "accent" : member.role === "MODERATOR" ? "success" : "neutral"}>
            {roleLabel}
          </Badge>

          {viewerIsFounder && member.role !== "FOUNDER" && (
            <>
              {/* SCHOOL classes have no moderator/transfer step — the teacher
                  manages the class directly (see core/membership/actions.ts).
                  A student can still be removed for the same reason a
                  COLLEGE course founder can remove one. */}
              {!isTeacherOwned && (
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
                </>
              )}
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
