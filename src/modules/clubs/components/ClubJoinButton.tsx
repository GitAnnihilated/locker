"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/components/Button";
import { joinClub, leaveClub } from "../actions";

export function ClubJoinButton({
  clubId,
  isMember,
  isFounder,
}: {
  clubId: string;
  isMember: boolean;
  isFounder: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="shrink-0 text-right">
      {isMember ? (
        <Button
          variant="secondary"
          size="sm"
          disabled={pending || isFounder}
          onClick={() => start(async () => setError((await leaveClub(clubId))?.error ?? null))}
        >
          {isFounder ? "Founder" : "Leave club"}
        </Button>
      ) : (
        <Button size="sm" disabled={pending} onClick={() => start(async () => setError((await joinClub(clubId))?.error ?? null))}>
          Join club
        </Button>
      )}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
