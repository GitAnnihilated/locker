import { requireUser } from "@/core/auth/session";
import {
  getActiveMembership,
  getClassMemberCount,
} from "@/core/membership/queries";
import { getSchoolListings } from "@/modules/marketplace/queries";
import { ListingForm } from "@/modules/marketplace/components/ListingForm";
import { Card, CardBody } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";
import { Avatar } from "@/ui/components/Avatar";
import { CosmeticName } from "@/ui/components/CosmeticName";
import { formatMoney } from "@/lib/format";

export default async function MarketplacePage() {
  const user = await requireUser();
  const membership = await getActiveMembership(user.id);
  if (!membership) {
    return <EmptyState icon="🚪" title="Join a class to access the marketplace" />;
  }

  // Liquidity gate: needs a few classmates before the marketplace is useful.
  const memberCount = await getClassMemberCount(membership.classId);
  if (memberCount < 3) {
    return (
      <EmptyState
        icon="🔒"
        title="Marketplace unlocks at 3 classmates"
        description="Invite classmates from your dashboard to open the school marketplace."
      />
    );
  }

  const listings = await getSchoolListings(membership.schoolId);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        {listings.length === 0 ? (
          <EmptyState
            icon="🛍️"
            title="No listings yet"
            description="Be the first to sell your old books or gear."
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
            <ListingForm />
          </div>
        </Card>
      </aside>
    </div>
  );
}
