"use client";

import { useState, useTransition } from "react";
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
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1 border-b border-border px-4 py-3 last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={moderator.user.name} image={moderator.user.image} size={28} />
          <span className="text-sm">{moderator.user.name ?? moderator.user.email}</span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const result = await removeSchoolModerator(schoolId, moderator.userId);
              setError(result?.error ?? null);
            })
          }
        >
          Remove
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
