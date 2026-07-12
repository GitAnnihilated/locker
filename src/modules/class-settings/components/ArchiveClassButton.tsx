"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/Button";
import { archiveClass } from "@/core/membership/actions";

export function ArchiveClassButton({ classId }: { classId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="danger"
      disabled={pending}
      onClick={() =>
        start(async () => {
          if (!confirm("Archive this class? It will be hidden but not deleted.")) return;
          await archiveClass(classId);
          router.push("/dashboard");
        })
      }
    >
      {pending ? "Archiving…" : "Archive class"}
    </Button>
  );
}
