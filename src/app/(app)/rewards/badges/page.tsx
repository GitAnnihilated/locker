import { requireUser } from "@/core/auth/session";
import { getBadgeCollection } from "@/core/rewards/queries";
import { Card, CardBody } from "@/ui/components/Card";
import { Badge } from "@/ui/components/Badge";
import { ProgressBar } from "@/ui/components/ProgressBar";
import { cn } from "@/lib/cn";

const RARITY_TONE: Record<string, "neutral" | "accent" | "success" | "warning"> = {
  COMMON: "neutral",
  RARE: "accent",
  EPIC: "warning",
  LEGENDARY: "success",
};

export default async function BadgesPage() {
  const user = await requireUser();
  const badges = await getBadgeCollection(user.id);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-subtle">
        {unlockedCount} of {badges.length} unlocked
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((b) => (
          <Card key={b.key} className={cn(!b.unlocked && "opacity-70")}>
            <CardBody>
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl",
                    !b.unlocked && "grayscale",
                  )}
                >
                  {b.icon}
                </span>
                <Badge tone={RARITY_TONE[b.rarity] ?? "neutral"}>{b.rarity}</Badge>
              </div>
              <p className="mt-3 font-semibold">{b.name}</p>
              <p className="mt-0.5 text-sm text-subtle">{b.description}</p>
              {b.unlocked ? (
                <p className="mt-2 text-2xs font-medium text-success">
                  Unlocked {b.unlockedAt?.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                </p>
              ) : (
                <div className="mt-2.5">
                  <ProgressBar pct={b.progressPct} />
                  <p className="mt-1 text-2xs text-faint">{b.progressPct}% complete</p>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
