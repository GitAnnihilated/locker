"use client";

import { useTransition } from "react";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { removeClassFromSchool, restoreClassInSchool } from "@/core/school/actions";
import type { ClassStatus } from "@prisma/client";

export function ClassModerationRow({
  schoolId,
  klass,
}: {
  schoolId: string;
  klass: { id: string; name: string; status: ClassStatus; founder: { name: string | null; email: string }; _count: { memberships: number } };
}) {
  const [pending, start] = useTransition();
  const isRemoved = klass.status === "REMOVED";

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0">
      <div>
        <p className="text-sm font-medium">{klass.name}</p>
        <p className="text-xs text-subtle">
          {klass._count.memberships} members · founded by {klass.founder.name ?? klass.founder.email}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={isRemoved ? "danger" : klass.status === "ARCHIVED" ? "neutral" : "success"}>
          {klass.status}
        </Badge>
        {isRemoved ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => start(() => restoreClassInSchool(schoolId, klass.id))}
          >
            Restore
          </Button>
        ) : (
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => start(() => removeClassFromSchool(schoolId, klass.id))}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
