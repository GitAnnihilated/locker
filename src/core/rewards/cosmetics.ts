import type { PerkSlot } from "@prisma/client";

/**
 * Pure, directive-free (no "use client"/"use server") so it's importable
 * from both server query files and client chat components — the shape
 * every equipped-perk lookup in the app reduces down to.
 */
export interface EquippedCosmetics {
  nameColor?: string;
  avatarFrame?: string;
  chatBubble?: string;
}

export const COSMETIC_SLOTS: PerkSlot[] = ["NAME_COLOR", "AVATAR_FRAME", "CHAT_BUBBLE"];

export function reduceCosmetics(rows: { perk: { slot: PerkSlot; value: string | null } }[]): EquippedCosmetics {
  const out: EquippedCosmetics = {};
  for (const row of rows) {
    if (!row.perk.value) continue;
    if (row.perk.slot === "NAME_COLOR") out.nameColor = row.perk.value;
    else if (row.perk.slot === "AVATAR_FRAME") out.avatarFrame = row.perk.value;
    else if (row.perk.slot === "CHAT_BUBBLE") out.chatBubble = row.perk.value;
  }
  return out;
}

/**
 * Flattens a Prisma row carrying a `perks: { perk: { slot, value } }[]`
 * relation (equipped-only, filtered in the query's `where`) into the plain
 * cosmetic fields — the one shared shape every query site normalizes into,
 * so the UI never has to know about the underlying UserPerk/Perk join.
 */
export function withCosmetics<T extends { perks: { perk: { slot: PerkSlot; value: string | null } }[] }>(
  row: T,
): Omit<T, "perks"> & EquippedCosmetics {
  const { perks, ...rest } = row;
  return { ...rest, ...reduceCosmetics(perks) };
}

/** The Prisma `select` fragment every query site uses to fetch equipped cosmetics for a user relation. */
export const cosmeticPerksSelect = {
  where: { equipped: true, perk: { slot: { in: COSMETIC_SLOTS } } },
  select: { perk: { select: { slot: true, value: true } } },
} as const;

/** Perk.value theme keys (seeded in prisma/seed.ts) mapped to actual bubble classes. */
export const CHAT_BUBBLE_THEMES: Record<string, string> = {
  mint: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
  sunset: "bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100",
  midnight: "bg-slate-800 text-slate-100",
};
