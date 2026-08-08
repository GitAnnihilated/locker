"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/Button";
import { leaveGroup } from "../actions";
import { GROUP_KIND_META } from "../meta";
import type { GroupKind } from "@prisma/client";

/**
 * Any member can leave. If they're the Leader, leadership auto-succeeds to
 * whoever's been on the project longest (see leaveGroup) — the confirmation
 * just makes that handoff explicit before it happens.
 */
export function LeaveGroupButton({
  groupId,
  isLeader,
  kind = "PROJECT",
}: {
  groupId: string;
  isLeader: boolean;
  kind?: GroupKind;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { noun } = GROUP_KIND_META[kind];

  const confirmMessage = isLeader
    ? `Leave this ${noun}? As Leader, ownership will automatically pass to whoever's been on it longest.`
    : `Leave this ${noun}?`;

  return (
    <div>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            if (!confirm(confirmMessage)) return;
            try {
              const result = await leaveGroup(groupId);
              if (result?.error) {
                setError(result.error);
                return;
              }
              router.push("/groups");
            } catch (e) {
              setError(e instanceof Error ? e.message : `Couldn't leave the ${noun}`);
            }
          })
        }
      >
        {pending ? "Leaving…" : `Leave ${noun}`}
      </Button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
