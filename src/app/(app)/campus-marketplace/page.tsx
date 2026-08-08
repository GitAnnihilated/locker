import { requireUser } from "@/core/auth/session";
import { getActiveMembership } from "@/core/membership/queries";
import { getSchoolListings } from "@/modules/marketplace/queries";
import { ListingForm } from "@/modules/marketplace/components/ListingForm";
import { Card, CardBody } from "@/ui/components/Card";
import { Badge } from "@/ui/components/Badge";
import { EmptyState } from "@/ui/components/EmptyState";
import { Avatar } from "@/ui/components/Avatar";
import { CosmeticName } from "@/ui/components/CosmeticName";
import { formatMoney } from "@/lib/format";
import { getMarketplaceCategories } from "@/core/education/config";

/**
 * College's Campus Marketplace — the exact same MarketplaceListing table
 * and createListing action as School's /marketplace (school-scoped, same
 * liquidity/anti-spam properties), just a different entry point with
 * College-flavored categories/copy. No 3-classmate liquidity gate here —
 * a college's "School" row (the institution) already has many students
 * the moment its first course exists.
 */
export default async function CampusMarketplacePage() {
  const user = await requireUser();
  const membership = await getActiveMembership(user.id);
  if (!membership) {
    return <EmptyState icon="🚪" title="Join a course to access the marketplace" />;
  }

  const listings = await getSchoolListings(membership.schoolId);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Campus Marketplace</h1>
          <p className="text-sm text-subtle">Textbooks, dorm gear, and electronics from other students.</p>
        </div>
        {listings.length === 0 ? (
          <EmptyState
            icon="🛍️"
            title="No listings yet"
            description="Be the first to sell your old textbooks or dorm gear."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {listings.map((l) => (
              <Card key={l.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{l.title}</p>
                    <span className="shrink-0 font-bold text-accent">
                      {formatMoney(l.priceCents, l.currency)}
                    </span>
                  </div>
                  {l.category && <Badge tone="neutral" className="mt-1">{l.category}</Badge>}
                  {l.description && (
                    <p className="mt-1 text-sm text-subtle">{l.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs text-subtle">
                    <Avatar name={l.seller.name} image={l.seller.image} size={20} frame={l.seller.avatarFrame} />
                    <CosmeticName color={l.seller.nameColor}>{l.seller.name}</CosmeticName>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      <aside>
        <Card>
          <div className="border-b border-border px-5 py-4 font-semibold">
            Sell something
          </div>
          <div className="p-5">
            <ListingForm categories={getMarketplaceCategories("COLLEGE")} />
          </div>
        </Card>
      </aside>
    </div>
  );
}
