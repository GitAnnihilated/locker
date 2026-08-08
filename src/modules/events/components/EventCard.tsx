"use client";

import { useState, useTransition } from "react";
import { Card, CardBody } from "@/ui/components/Card";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { rsvpEvent, cancelRsvp } from "../actions";
import type { UpcomingEvent } from "../queries";

export function EventCard({ event }: { event: UpcomingEvent }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold">{event.title}</p>
            <p className="text-xs text-subtle">
              {new Date(event.startAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              {event.location && ` · ${event.location}`}
            </p>
          </div>
          {event.club && <Badge tone="neutral">{event.club.name}</Badge>}
        </div>
        {event.description && <p className="mt-2 line-clamp-2 text-sm text-subtle">{event.description}</p>}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-subtle">
            {event.attendeeCount} going · hosted by {event.organizer.name}
          </p>
          {event.isAttending ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => start(async () => setError((await cancelRsvp(event.id))?.error ?? null))}
            >
              Going ✓
            </Button>
          ) : (
            <Button size="sm" disabled={pending} onClick={() => start(async () => setError((await rsvpEvent(event.id))?.error ?? null))}>
              I&apos;m going
            </Button>
          )}
        </div>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </CardBody>
    </Card>
  );
}
