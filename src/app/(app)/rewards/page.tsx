import { requireUser } from "@/core/auth/session";
import { getProgressSummary, getBadgeCollection } from "@/core/rewards/queries";
import { Card, CardBody } from "@/ui/components/Card";
import { Badge } from "@/ui/components/Badge";
import { ProgressBar } from "@/ui/components/ProgressBar";
import { StatTile } from "@/ui/components/StatTile";

export default async function RewardsProgressPage() {
  const user = await requireUser();
  const [progress, badges] = await Promise.all([getProgressSummary(user.id), getBadgeCollection(user.id)]);

  const nextBadge = badges
    .filter((b) => !b.unlocked)
    .sort((a, b) => b.progressPct - a.progressPct)[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-accent">
                Level {progress.level}{progress.levelTitle ? ` · ${progress.levelTitle}` : ""}
              </p>
              <p className="mt-1 text-2xl font-bold">{progress.totalEarned.toLocaleString()} XP</p>
            </div>
            <div className="text-right">
              <p className="text-2xs text-faint">Spendable</p>
              <p className="text-lg font-bold text-accent">{progress.points.toLocaleString()} pts</p>
            </div>
          </div>

          {!progress.isMaxLevel && (
            <div>
              <ProgressBar pct={progress.progressPct} />
              <p className="mt-1.5 text-xs text-subtle">
                {progress.pointsToNextLevel.toLocaleString()} XP to level {progress.level + 1}
                {progress.nextLevelTitle ? ` (${progress.nextLevelTitle})` : ""}
              </p>
            </div>
          )}
          {progress.isMaxLevel && <p className="text-xs text-subtle">Max level reached 🎉</p>}
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile href="/rewards/store" label="Points to spend" value={progress.points} icon="🏆" tint="accent" />
        <StatTile
          href="/rewards"
          label="Current streak"
          value={progress.currentStreak}
          icon="🔥"
          tint="orange"
        />
        <StatTile href="/rewards/badges" label="Longest streak" value={progress.longestStreak} icon="📈" tint="lime" />
      </div>

      {nextBadge && (
        <Card>
          <CardBody>
            <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-faint">Next badge</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-xl grayscale">
                {nextBadge.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{nextBadge.name}</p>
                  <Badge tone="neutral">{nextBadge.rarity}</Badge>
                </div>
                <p className="text-sm text-subtle">{nextBadge.description}</p>
              </div>
            </div>
            <div className="mt-3">
              <ProgressBar pct={nextBadge.progressPct} />
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
