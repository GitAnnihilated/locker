"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/Button";
import { archiveClass } from "@/core/membership/actions";

export function ArchiveClassButton({ classId }: { classId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      <Button
        variant="danger"
        disabled={pending}
        onClick={() =>
          start(async () => {
            if (!confirm("Archive this class? It will be hidden but not deleted.")) return;
            const result = await archiveClass(classId);
            if (result?.error) {
              setError(result.error);
              return;
            }
            router.push("/dashboard");
          })
        }
      >
        {pending ? "Archiving…" : "Archive class"}
      </Button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
