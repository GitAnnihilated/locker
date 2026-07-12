"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/Button";
import { leaveClass } from "@/core/membership/actions";

/**
 * Never gated — a student can always walk away from a class. If they're the
 * Founder, leadership auto-succeeds to whoever's been there longest (see
 * leaveClass), so the warning is about that handoff, not a block.
 */
export function LeaveClassButton({
  classId,
  isFounder,
}: {
  classId: string;
  isFounder: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const confirmMessage = isFounder
    ? "Leave this class? As Founder, ownership will automatically pass to whoever's been in the class longest."
    : "Leave this class?";

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
              await leaveClass(classId);
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Couldn't leave the class");
            }
          })
        }
      >
        {pending ? "Leaving…" : "Leave class"}
      </Button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
