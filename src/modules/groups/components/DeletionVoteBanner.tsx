"use client";

import { useState, useTransition } from "react";
import { Card, CardBody } from "@/ui/components/Card";
import { Button } from "@/ui/components/Button";
import { startDeletionVote, castDeletionVote } from "../actions";
import type { GroupDashboard } from "../queries";

export function DeletionVoteBanner({
  groupId,
  openVote,
  memberCount,
  viewerId,
  viewerIsLeader,
}: {
  groupId: string;
  openVote: GroupDashboard["deletionVotes"][number] | undefined;
  memberCount: number;
  viewerId: string;
  viewerIsLeader: boolean;
}) {
  const [pending, start] = useTransition();
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (resultMessage) {
    return (
      <Card className="border-warning/30 bg-warning/5">
        <CardBody>
          <p className="text-sm font-medium">{resultMessage}</p>
        </CardBody>
      </Card>
    );
  }

  if (!openVote) {
    if (!viewerIsLeader) return null;
    return (
      <Card className="border-danger/30">
        <CardBody className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Want to delete this project?</p>
            <p className="text-xs text-subtle">
              Every member votes — it only deletes with a majority.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={() => {
              if (!confirm("Start a deletion vote? Every member will be notified.")) return;
              start(async () => {
                const result = await startDeletionVote(groupId);
                if (result && "error" in result) setError(result.error);
              });
            }}
          >
            Start deletion vote
          </Button>
        </CardBody>
        {error && <p className="px-4 pb-4 text-sm text-danger">{error}</p>}
      </Card>
    );
  }

  const myBallot = openVote.ballots.find((b) => b.userId === viewerId);
  const deleteCount = openVote.ballots.filter((b) => b.choice === "DELETE").length;
  const votedCount = openVote.ballots.length;

  return (
    <Card className="border-danger/30 bg-danger/5">
      <CardBody>
        <p className="text-sm font-medium">Deletion vote in progress</p>
        <p className="mt-1 text-xs text-subtle">
          {votedCount}/{memberCount} voted · {deleteCount} to delete so far
        </p>

        {myBallot ? (
          <p className="mt-3 text-sm">
            You voted <strong>{myBallot.choice === "DELETE" ? "Delete" : "Keep"}</strong>. Waiting on the rest of the team.
          </p>
        ) : (
          <div className="mt-3 flex gap-2">
            <Button
              variant="danger"
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const outcome = await castDeletionVote(openVote.id, "DELETE");
                  if ("error" in outcome) setError(outcome.error);
                  else if (outcome.message) setResultMessage(outcome.message);
                })
              }
            >
              Delete
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const outcome = await castDeletionVote(openVote.id, "KEEP");
                  if ("error" in outcome) setError(outcome.error);
                  else if (outcome.message) setResultMessage(outcome.message);
                })
              }
            >
              Keep
            </Button>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </CardBody>
    </Card>
  );
}
