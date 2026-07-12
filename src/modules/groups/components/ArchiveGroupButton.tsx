"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/Button";
import { archiveGroup } from "../actions";

export function ArchiveGroupButton({ groupId }: { groupId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Archive this project? It will be hidden from the class list but not deleted.")) return;
        start(async () => {
          await archiveGroup(groupId);
          router.push("/groups");
        });
      }}
    >
      {pending ? "Archiving…" : "Archive project"}
    </Button>
  );
}
