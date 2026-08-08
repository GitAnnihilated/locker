"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Card, CardBody } from "@/ui/components/Card";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { joinClub, leaveClub } from "../actions";
import type { SchoolClub } from "../queries";

export function ClubCard({ club }: { club: SchoolClub }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/clubs/${club.id}`} className="font-semibold hover:underline">
              {club.name}
            </Link>
            {club.category && <p className="text-xs text-subtle">{club.category}</p>}
          </div>
          {club.myRole === "ORGANIZER" && <Badge tone="accent">Organizer</Badge>}
        </div>
        {club.description && <p className="mt-2 line-clamp-2 text-sm text-subtle">{club.description}</p>}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-subtle">
            {club.memberCount} member{club.memberCount === 1 ? "" : "s"}
          </p>
          {club.isMember ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={pending || club.myRole === "ORGANIZER"}
              onClick={() => start(async () => setError((await leaveClub(club.id))?.error ?? null))}
            >
              {club.myRole === "ORGANIZER" ? "Joined" : "Leave"}
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={pending}
              onClick={() => start(async () => setError((await joinClub(club.id))?.error ?? null))}
            >
              Join
            </Button>
          )}
        </div>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </CardBody>
    </Card>
  );
}
