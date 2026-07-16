"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/ui/components/Modal";
import { Button } from "@/ui/components/Button";
import { Badge } from "@/ui/components/Badge";
import { getPendingCelebrations, markCelebrationSeen } from "@/core/rewards/actions";

type CelebrationEvent = Awaited<ReturnType<typeof getPendingCelebrations>>[number];

const TYPE_LABEL: Record<CelebrationEvent["type"], string> = {
  BADGE: "Badge unlocked",
  LEVEL_UP: "Level up",
  PERK: "New perk",
  STREAK_MILESTONE: "Streak milestone",
};

const RARITY_TONE: Record<string, "neutral" | "accent" | "success" | "warning"> = {
  COMMON: "neutral",
  RARE: "accent",
  EPIC: "warning",
  LEGENDARY: "success",
};

/**
 * Drains the Celebration queue (badges/levels/perks/streak milestones) one
 * modal at a time. Fetched once on mount rather than threaded through every
 * point-earning action's return value — those actions live across many
 * modules (homework, groups, membership...), and this way none of them
 * need to know celebrations exist at all.
 */
export function CelebrationQueue() {
  const [queue, setQueue] = useState<CelebrationEvent[]>([]);

  useEffect(() => {
    void getPendingCelebrations().then(setQueue);
  }, []);

  const current = queue[0];

  function dismiss() {
    if (!current) return;
    void markCelebrationSeen(current.id);
    setQueue((prev) => prev.slice(1));
  }

  if (!current) return null;

  return (
    <Modal open onClose={dismiss} className="text-center">
      <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-accent">
        {TYPE_LABEL[current.type]}
      </p>
      <div className="animate-celebration-pop mx-auto mt-3 flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft text-4xl">
        {current.icon ?? "🎉"}
      </div>
      <h2 className="mt-4 text-xl font-bold">{current.title}</h2>
      {current.description && <p className="mt-1 text-sm text-subtle">{current.description}</p>}
      {current.rarity && (
        <Badge tone={RARITY_TONE[current.rarity] ?? "neutral"} className="mt-3">
          {current.rarity}
        </Badge>
      )}
      <Button size="lg" className="mt-6 w-full" onClick={dismiss}>
        Awesome!
      </Button>
      {queue.length > 1 && (
        <p className="mt-2 text-2xs text-faint">+{queue.length - 1} more</p>
      )}
    </Modal>
  );
}
