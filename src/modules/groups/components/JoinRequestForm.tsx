"use client";

import { useState, useTransition } from "react";
import { Card, CardBody } from "@/ui/components/Card";
import { Button } from "@/ui/components/Button";
import { Textarea } from "@/ui/components/Input";
import { requestToJoin } from "../actions";

export function JoinRequestForm({ groupId }: { groupId: string }) {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sent) {
    return (
      <Card>
        <CardBody className="text-center text-sm text-subtle">
          Request sent — the Leader will review it.
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <p className="mb-2 text-sm font-medium">Want to join this project?</p>
        <form
          action={(fd) =>
            start(async () => {
              setError(null);
              try {
                await requestToJoin(groupId, fd);
                setSent(true);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Something went wrong");
              }
            })
          }
          className="space-y-2"
        >
          <Textarea name="message" placeholder="Optional: why you'd be a good fit" />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={pending} size="sm">
            {pending ? "Sending…" : "Request to join"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
