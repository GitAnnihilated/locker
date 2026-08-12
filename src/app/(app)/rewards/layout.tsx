import { requireDbUser } from "@/core/auth/session";
import { EmptyState } from "@/ui/components/EmptyState";
import { RewardsTabs } from "@/modules/rewards/components/RewardsTabs";

/**
 * Gamification (points/badges/streaks/perks) is a student-motivation
 * layer — gated here, not just hidden from nav (see core/modules/registry.ts),
 * so a teacher/principal can't reach it by URL either.
 */
export default async function RewardsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireDbUser();
  if (user.role !== "STUDENT") {
    return <EmptyState icon="🏆" title="Students only" description="Rewards is a student-motivation feature, not something staff accounts use." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Rewards</h1>
        <p className="mt-1 text-sm text-subtle">Points, badges, streaks, and the perk store.</p>
      </div>
      <RewardsTabs />
      {children}
    </div>
  );
}
