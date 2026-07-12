"use client";

import { useState } from "react";
import { Card, CardBody } from "@/ui/components/Card";
import { Button } from "@/ui/components/Button";

/**
 * The single most important growth surface. Every extra classmate makes the
 * homework board more reliable and the marketplace more liquid — so we keep
 * the invite code one tap away at all times.
 */
export function InviteCard({
  className,
  inviteCode,
  memberCount,
}: {
  className: string;
  inviteCode: string;
  memberCount: number;
}) {
  const [copied, setCopied] = useState(false);
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/onboarding?code=${inviteCode}`
      : "";

  const copy = async () => {
    await navigator.clipboard.writeText(link || inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Join our class on Locker",
        text: `Join ${className} on Locker — shared homework, marketplace & more.`,
        url: link,
      });
    } else {
      copy();
    }
  };

  return (
    <Card className="border-accent/25 bg-accent-soft">
      <CardBody>
        <p className="font-semibold">Invite your classmates</p>
        <p className="mt-1 text-sm text-subtle">
          {memberCount < 3
            ? `${3 - memberCount} more classmate${3 - memberCount === 1 ? "" : "s"} unlocks the Marketplace.`
            : "A fuller class means a more reliable homework board. Keep inviting."}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <code className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-center text-lg font-bold tracking-widest">
            {inviteCode}
          </code>
          <Button variant="secondary" onClick={copy}>
            {copied ? "Copied!" : "Copy link"}
          </Button>
          <Button onClick={share}>Share</Button>
        </div>
      </CardBody>
    </Card>
  );
}
