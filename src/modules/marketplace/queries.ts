import { db } from "@/core/db/client";

/** Active listings across the whole SCHOOL — bigger school = more liquidity. */
export async function getSchoolListings(schoolId: string) {
  return db.marketplaceListing.findMany({
    where: { schoolId, status: "ACTIVE", deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { seller: { select: { id: true, name: true, image: true } } },
  });
}
