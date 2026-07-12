import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { getActiveMembership } from "@/core/membership/queries";
import { getProfile, getProfileStats } from "@/modules/profile/queries";
import { ProfileHeader } from "@/modules/profile/components/ProfileHeader";
import { Card, CardBody } from "@/ui/components/Card";
import { Badge } from "@/ui/components/Badge";
import { EmptyState } from "@/ui/components/EmptyState";
import { StatTile } from "@/ui/components/StatTile";

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile, stats, membership] = await Promise.all([
    getProfile(user.id),
    getProfileStats(user.id),
    getActiveMembership(user.id),
  ]);

  if (!profile) {
    return <EmptyState icon="👤" title="Profile not found" />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardBody>
          <ProfileHeader profile={profile} />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-subtle">
            School & class
          </p>
          {membership ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{membership.class.name}</p>
                <Badge tone={membership.role === "FOUNDER" ? "accent" : membership.role === "MODERATOR" ? "success" : "neutral"}>
                  {membership.role}
                </Badge>
              </div>
              <Link href="/dashboard" className="text-sm font-medium text-accent hover:underline">
                View dashboard
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-subtle">Not in a class yet.</p>
              <Link href="/onboarding" className="text-sm font-medium text-accent hover:underline">
                Join a class
              </Link>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <StatTile href="/achievements" label="Achievements" value={stats.achievementsCount} icon="🏅" tint="accent" />
        <StatTile href="/badges" label="Badges" value={stats.badgesCount} icon="🎖️" tint="orange" />
        <StatTile href="/marketplace" label="Listings" value={stats.listingsCount} icon="🛍️" tint="lime" />
      </div>
    </div>
  );
}
