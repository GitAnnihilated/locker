"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { regenerateInviteCode } from "@/core/membership/actions";

export function InviteCodePanel({
  classId,
  initialCode,
}: {
  classId: string;
  initialCode: string;
}) {
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <code className="rounded-md border border-border bg-muted px-3 py-2 text-lg font-bold tracking-widest">
        {code}
      </code>
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const next = await regenerateInviteCode(classId);
            if (typeof next === "string") {
              setCode(next);
              setError(null);
            } else {
              setError(next.error);
            }
          })
        }
      >
        {pending ? "Rotating…" : "Generate new code"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
