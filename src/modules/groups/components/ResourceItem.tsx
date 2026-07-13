"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { RESOURCE_TYPE_META } from "../meta";
import { removeResource } from "../actions";
import type { GroupDashboard } from "../queries";

export function ResourceItem({
  resource,
  canRemove,
}: {
  resource: GroupDashboard["resources"][number];
  canRemove: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const meta = RESOURCE_TYPE_META[resource.type];
  const uploaderName = resource.uploader.nickname || resource.uploader.name || "Someone";

  return (
    <div className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-lg">
        {meta.icon}
      </div>
      <div className="min-w-0 flex-1">
        <a href={resource.url} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
          {resource.title}
        </a>
        {resource.description && <p className="mt-0.5 text-sm text-subtle">{resource.description}</p>}
        <p className="mt-1 text-xs text-subtle">
          {meta.label} · shared by {uploaderName} ·{" "}
          {new Date(resource.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </p>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
      {canRemove && (
        <Button
          size="sm"
          variant="ghost"
          className="text-danger"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const result = await removeResource(resource.id);
              setError(result?.error ?? null);
            })
          }
        >
          Remove
        </Button>
      )}
    </div>
  );
}
