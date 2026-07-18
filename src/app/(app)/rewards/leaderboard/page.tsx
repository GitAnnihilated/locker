import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { getActiveMembership } from "@/core/membership/queries";
import { getLeaderboard, getEquippedCosmeticsForUsers, type LeaderboardScope } from "@/core/rewards/queries";
import { Avatar } from "@/ui/components/Avatar";
import { CosmeticName } from "@/ui/components/CosmeticName";
import { Card, CardBody } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";
import { cn } from "@/lib/cn";

const SCOPES: { key: LeaderboardScope; label: string }[] = [
  { key: "school", label: "My school" },
  { key: "weekly", label: "This week" },
  { key: "monthly", label: "This month" },
  { key: "all-time", label: "All-time" },
];

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const user = await requireUser();
  const { scope: rawScope } = await searchParams;
  const scope: LeaderboardScope = SCOPES.some((s) => s.key === rawScope) ? (rawScope as LeaderboardScope) : "school";

  const membership = await getActiveMembership(user.id);
  const rows = await getLeaderboard(scope, { schoolId: membership?.schoolId });
  const cosmetics = await getEquippedCosmeticsForUsers(rows.map((r) => r.user.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SCOPES.map((s) => (
          <Link
            key={s.key}
            href={`/rewards/leaderboard?scope=${s.key}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition duration ease",
              scope === s.key ? "bg-accent text-accent-fg" : "bg-muted text-subtle hover:text-text",
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="🏆" title="No rankings yet" description="Be the first to earn points here." />
      ) : (
        <Card>
          <CardBody className="space-y-1">
            {rows.map((row, i) => {
              const mine = row.user.id === user.id;
              const name = row.user.nickname || row.user.name || "Member";
              const rowCosmetics = cosmetics.get(row.user.id);
              return (
                <div
                  key={row.user.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-2",
                    mine && "bg-accent-soft",
                  )}
                >
                  <span className="w-7 shrink-0 text-center text-sm font-semibold text-subtle">
                    {MEDALS[i] ?? i + 1}
                  </span>
                  <Avatar name={name} image={row.user.image} size={32} frame={rowCosmetics?.avatarFrame} />
                  <p className={cn("min-w-0 flex-1 truncate text-sm", mine ? "font-semibold text-accent" : "font-medium")}>
                    <CosmeticName color={rowCosmetics?.nameColor}>{name}</CosmeticName>
                    {mine && " (you)"}
                  </p>
                  <p className="shrink-0 text-sm font-semibold">{row.score.toLocaleString()}</p>
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
