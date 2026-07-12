import { Card, CardBody } from "@/ui/components/Card";
import { LEVEL_META } from "../meta";
import type { getAchievementStats } from "../queries";

/**
 * Deliberately no points/XP here — a real portfolio shows what was earned,
 * not a score. Only levels with at least one achievement are shown, most
 * prestigious first.
 */
export function StatsBar({ stats }: { stats: Awaited<ReturnType<typeof getAchievementStats>> }) {
  const levelEntries = (Object.keys(LEVEL_META) as Array<keyof typeof LEVEL_META>)
    .filter((level) => stats.byLevel[level] > 0)
    .sort((a, b) => LEVEL_META[b].weight - LEVEL_META[a].weight);

  return (
    <Card>
      <CardBody>
        <p className="text-3xl font-bold">{stats.total}</p>
        <p className="text-sm text-subtle">
          Achievement{stats.total === 1 ? "" : "s"}
        </p>

        {levelEntries.length > 0 && (
          <div className="mt-4 space-y-1.5 border-t border-border pt-4">
            {levelEntries.map((level) => (
              <div key={level} className="flex items-center justify-between text-sm">
                <span className="text-subtle">{LEVEL_META[level].label}</span>
                <span className="font-semibold">{stats.byLevel[level]}</span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
