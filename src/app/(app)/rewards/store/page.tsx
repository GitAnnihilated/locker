import { requireUser } from "@/core/auth/session";
import { getPerkStore } from "@/core/rewards/queries";
import { PerkCard } from "@/modules/rewards/components/PerkCard";

const SLOT_LABEL: Record<string, string> = {
  NAME_COLOR: "Name colors",
  AVATAR_FRAME: "Avatar frames",
  CHAT_BUBBLE: "Chat bubble styles",
  CELEBRATION_EFFECT: "Celebration effects",
  COSMETIC_BADGE: "Cosmetic badges",
  UTILITY: "Utility",
};

const SLOT_ORDER = ["NAME_COLOR", "AVATAR_FRAME", "CHAT_BUBBLE", "CELEBRATION_EFFECT", "COSMETIC_BADGE", "UTILITY"];

export default async function StorePage() {
  const user = await requireUser();
  const { points, perks } = await getPerkStore(user.id);

  const bySlot = new Map<string, typeof perks>();
  for (const perk of perks) {
    const list = bySlot.get(perk.slot) ?? [];
    list.push(perk);
    bySlot.set(perk.slot, list);
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-subtle">
        You have <span className="font-semibold text-accent">{points.toLocaleString()} points</span> to spend.
        Perks are cosmetic and convenience only — nothing here gives an academic edge.
      </p>

      {SLOT_ORDER.filter((slot) => bySlot.has(slot)).map((slot) => (
        <div key={slot}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-faint">{SLOT_LABEL[slot]}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bySlot.get(slot)!.map((perk) => (
              <PerkCard key={perk.key} perk={perk} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
