import { RewardsTabs } from "@/modules/rewards/components/RewardsTabs";

export default function RewardsLayout({ children }: { children: React.ReactNode }) {
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
