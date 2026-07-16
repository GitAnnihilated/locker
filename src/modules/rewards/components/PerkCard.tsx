"use client";

import { useState, useTransition } from "react";
import { Card, CardBody } from "@/ui/components/Card";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { cn } from "@/lib/cn";
import { purchasePerk, equipPerk, unequipPerk } from "@/core/rewards/actions";
import type { getPerkStore } from "@/core/rewards/queries";

type PerkRow = Awaited<ReturnType<typeof getPerkStore>>["perks"][number];

const RARITY_TONE: Record<string, "neutral" | "accent" | "success" | "warning"> = {
  COMMON: "neutral",
  RARE: "accent",
  EPIC: "warning",
  LEGENDARY: "success",
};

export function PerkCard({ perk }: { perk: PerkRow }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const equippable = perk.slot !== "UTILITY";

  function handlePurchase() {
    setError(null);
    start(async () => {
      const result = await purchasePerk(perk.key);
      if (result && "error" in result) setError(result.error);
    });
  }

  function handleEquipToggle() {
    setError(null);
    start(async () => {
      const result = perk.equipped ? await unequipPerk(perk.key) : await equipPerk(perk.key);
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <Card className={cn(perk.equipped && "ring-2 ring-accent")}>
      <CardBody>
        <div className="flex items-start justify-between gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl">{perk.icon}</span>
          <Badge tone={RARITY_TONE[perk.rarity] ?? "neutral"}>{perk.rarity}</Badge>
        </div>
        <p className="mt-3 font-semibold">{perk.name}</p>
        <p className="mt-0.5 text-sm text-subtle">{perk.description}</p>

        {perk.owned && perk.slot === "UTILITY" && (
          <p className="mt-2 text-2xs font-medium text-subtle">You have {perk.quantity}</p>
        )}

        {error && <p className="mt-2 text-2xs text-danger">{error}</p>}

        <div className="mt-3 flex items-center justify-between gap-2">
          {!perk.owned || perk.slot === "UTILITY" ? (
            <Button
              size="sm"
              variant={perk.purchasable ? "primary" : "secondary"}
              disabled={pending || !perk.purchasable || (!perk.affordable && perk.purchasable)}
              onClick={handlePurchase}
            >
              {!perk.purchasable ? "Streak reward only" : `${perk.price.toLocaleString()} pts`}
            </Button>
          ) : equippable ? (
            <Button size="sm" variant={perk.equipped ? "secondary" : "primary"} disabled={pending} onClick={handleEquipToggle}>
              {perk.equipped ? "Unequip" : "Equip"}
            </Button>
          ) : (
            <Badge tone="success">Owned</Badge>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
