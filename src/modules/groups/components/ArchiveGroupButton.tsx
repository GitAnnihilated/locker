"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/Button";
import { archiveGroup } from "../actions";

export function ArchiveGroupButton({ groupId }: { groupId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!confirm("Archive this project? It will be hidden from the class list but not deleted.")) return;
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
        {pending ? "Archiving…" : "Archive project"}
      </Button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
