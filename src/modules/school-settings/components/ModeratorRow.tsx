"use client";

import { useTransition } from "react";
import { Avatar } from "@/ui/components/Avatar";
import { Button } from "@/ui/components/Button";
import { removeSchoolModerator } from "@/core/school/actions";

export function ModeratorRow({
  schoolId,
  moderator,
}: {
  schoolId: string;
  moderator: { userId: string; user: { name: string | null; email: string; image: string | null } };
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <Avatar name={moderator.user.name} image={moderator.user.image} size={28} />
        <span className="text-sm">{moderator.user.name ?? moderator.user.email}</span>
      </div>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => start(() => removeSchoolModerator(schoolId, moderator.userId))}
      >
        Remove
      </Button>
    </div>
  );
}
