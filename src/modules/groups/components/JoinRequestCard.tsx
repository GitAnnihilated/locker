"use client";

import { useTransition } from "react";
import { Card, CardBody } from "@/ui/components/Card";
import { Avatar } from "@/ui/components/Avatar";
import { Button } from "@/ui/components/Button";
import { relativeTime } from "@/lib/format";
import { acceptJoinRequest, rejectJoinRequest } from "../actions";
import type { GroupDashboard } from "../queries";

export function JoinRequestCard({ request }: { request: GroupDashboard["joinRequests"][number] }) {
  const [pending, start] = useTransition();
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
            onClick={() => start(() => rejectJoinRequest(request.id))}
          >
            Reject
          </Button>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => start(() => acceptJoinRequest(request.id))}
          >
            Accept
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
