import { requireUser } from "@/core/auth/session";
import { getAchievementsForUser, getAchievementStats } from "@/modules/achievements/queries";
import { AchievementCard } from "@/modules/achievements/components/AchievementCard";
import { AchievementForm } from "@/modules/achievements/components/AchievementForm";
import { StatsBar } from "@/modules/achievements/components/StatsBar";
import { Card, CardHeader } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";

export default async function AchievementsPage() {
  const user = await requireUser();
  const [achievements, stats] = await Promise.all([
    getAchievementsForUser(user.id),
    getAchievementStats(user.id),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Achievements</h1>
          <p className="text-sm text-subtle">
            Your portfolio of real accomplishments — competitions, awards, certifications, and more.
          </p>
        </div>

        {achievements.length === 0 ? (
          <EmptyState
            icon="🏅"
            title="Start your portfolio"
            description="Add an olympiad, a medal, a certification — anything you're proud of."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {achievements.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-6">
        <StatsBar stats={stats} />
        <Card>
          <CardHeader className="font-semibold">Add achievement</CardHeader>
          <div className="p-5">
            <AchievementForm />
          </div>
        </Card>
      </aside>
    </div>
  );
}
