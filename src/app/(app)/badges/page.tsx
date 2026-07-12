import { requireUser } from "@/core/auth/session";
import { getBadgesForUser } from "@/modules/badges/queries";
import { Card, CardBody } from "@/ui/components/Card";
import { Badge } from "@/ui/components/Badge";
import { EmptyState } from "@/ui/components/EmptyState";
import { cn } from "@/lib/cn";

export default async function BadgesPage() {
  const user = await requireUser();
  const badges = await getBadgesForUser(user.id);
  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalPoints = badges.filter((b) => b.unlocked).reduce((sum, b) => sum + b.points, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Locker Badges</h1>
          <p className="text-sm text-subtle">
            Earned by using Locker — streaks, contributions, milestones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="accent">⭐ {totalPoints} points</Badge>
          <Badge>{unlockedCount}/{badges.length} unlocked</Badge>
        </div>
      </div>

      {badges.length === 0 ? (
        <EmptyState icon="🎖️" title="No badges yet" description="Keep using Locker to start unlocking them." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => (
            <Card key={b.id} className={cn(!b.unlocked && "opacity-60 grayscale")}>
              <CardBody className="text-center">
                <div className="text-4xl">{b.icon}</div>
                <p className="mt-2 font-semibold">{b.name}</p>
                <p className="mt-1 text-sm text-subtle">{b.description}</p>
                <div className="mt-3">
                  {b.unlocked ? (
                    <Badge tone="success">Unlocked · {b.points} pts</Badge>
                  ) : (
                    <Badge>Locked · {b.points} pts</Badge>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
