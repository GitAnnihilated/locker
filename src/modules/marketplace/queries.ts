import { db } from "@/core/db/client";
import { cosmeticPerksSelect, withCosmetics } from "@/core/rewards/cosmetics";

/** Active listings across the whole SCHOOL — bigger school = more liquidity. */
export async function getSchoolListings(schoolId: string) {
  const listings = await db.marketplaceListing.findMany({
    where: { schoolId, status: "ACTIVE", deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { seller: { select: { id: true, name: true, image: true, perks: cosmeticPerksSelect } } },
  });
  return listings.map((l) => ({ ...l, seller: withCosmetics(l.seller) }));
}
