"use client";

import { useState, useTransition } from "react";
import { Card, CardBody } from "@/ui/components/Card";
import { Avatar } from "@/ui/components/Avatar";
import { Button } from "@/ui/components/Button";
import { relativeTime } from "@/lib/format";
import { acceptJoinRequest, rejectJoinRequest } from "../actions";
import type { GroupDashboard } from "../queries";

export function JoinRequestCard({ request }: { request: GroupDashboard["joinRequests"][number] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const name = request.user.nickname || request.user.name || "A student";

  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-3">
          <Avatar name={name} image={request.user.image} size={36} />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{name}</p>
            {request.message && (
              <p className="mt-1 text-sm text-subtle">&quot;{request.message}&quot;</p>
            )}
            <p className="mt-1 text-xs text-subtle">Requested {relativeTime(request.createdAt)}</p>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await rejectJoinRequest(request.id);
                setError(result?.error ?? null);
              })
            }
          >
            Reject
          </Button>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await acceptJoinRequest(request.id);
                setError(result?.error ?? null);
              })
            }
          >
            Accept
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </CardBody>
    </Card>
  );
}
