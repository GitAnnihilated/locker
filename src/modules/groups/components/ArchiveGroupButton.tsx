"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/Button";
import { archiveGroup } from "../actions";
import { GROUP_KIND_META } from "../meta";
import type { GroupKind } from "@prisma/client";

export function ArchiveGroupButton({ groupId, kind = "PROJECT" }: { groupId: string; kind?: GroupKind }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { noun } = GROUP_KIND_META[kind];

  return (
    <div>
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Archive this ${noun}? It will be hidden from the class list but not deleted.`)) return;
          start(async () => {
            const result = await archiveGroup(groupId);
            if (result?.error) {
              setError(result.error);
              return;
            }
            router.push("/groups");
          });
        }}
      >
        {pending ? "Archiving…" : `Archive ${noun}`}
      </Button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
