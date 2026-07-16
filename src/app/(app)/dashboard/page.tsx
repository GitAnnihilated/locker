import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { db } from "@/core/db/client";
import {
  getActiveMembership,
  getClassMemberCount,
} from "@/core/membership/queries";
import { getSchool, getSchoolModerators } from "@/core/school/queries";
import { canAccessSchoolSettings } from "@/core/permissions/rules";
import { enabledModules } from "@/core/modules/registry";
import { getPendingHomeworkCount } from "@/modules/homework/queries";
import { getMyActiveGroupCount } from "@/modules/groups/queries";
import { getAchievementCount } from "@/modules/achievements/queries";
import { getProgressSummary } from "@/core/rewards/queries";
import { Card, CardBody } from "@/ui/components/Card";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { EmptyState } from "@/ui/components/EmptyState";
import { StatTile } from "@/ui/components/StatTile";
import { InviteCard } from "@/modules/invites/components/InviteCard";
import { LeaveClassButton } from "@/modules/invites/components/LeaveClassButton";

const MODULE_TINT: Record<string, "accent" | "lime" | "orange"> = {
  homework: "accent",
  marketplace: "orange",
  groups: "lime",
  achievements: "accent",
  rewards: "orange",
  messages: "lime",
};

export default async function DashboardPage() {
  const user = await requireUser();
  // Name/nickname live in the DB, not the JWT — see core/auth/auth.ts — so a
  // freshly-completed Profile Setup shows up immediately, not after re-login.
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true, nickname: true },
  });
  const displayName = dbUser?.nickname || dbUser?.name;
  const membership = await getActiveMembership(user.id);

  if (!membership) {
    return (
      <EmptyState
        icon="👋"
        title={`Welcome, ${displayName?.split(" ")[0] ?? "student"}!`}
        description="Join your class to unlock everything Locker can do."
        action={
          <Link href="/onboarding">
            <Button>Get started</Button>
          </Link>
        }
      />
    );
  }

  const [memberCount, school, pendingHomework, activeGroups, achievementCount, progress] = await Promise.all([
    getClassMemberCount(membership.classId),
    getSchool(membership.schoolId),
    getPendingHomeworkCount(membership.classId, user.id),
    getMyActiveGroupCount(membership.classId, user.id),
    getAchievementCount(user.id),
    getProgressSummary(user.id),
  ]);
  const schoolModerators = school ? await getSchoolModerators(school.id) : [];

  const canManageSchool =
    school != null &&
    canAccessSchoolSettings(user.id, {
      founderId: school.founderId,
      moderatorUserIds: schoolModerators.map((m) => m.userId),
    });

  return (
    <div className="animate-fade-up space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hey {displayName?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="mt-1 text-sm text-subtle">
            {membership.class.name} · {memberCount} member
            {memberCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {progress.currentStreak > 0 && (
            <Badge tone="warning">🔥 {progress.currentStreak}-day streak</Badge>
          )}
          <Badge tone="accent">⭐ Lv. {progress.level}</Badge>
          <Badge tone={membership.role === "FOUNDER" ? "accent" : membership.role === "MODERATOR" ? "success" : "neutral"}>
            {membership.role}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatTile href="/homework" label="Due" value={pendingHomework} icon="📚" tint="accent" />
        <StatTile href="/groups" label="Active projects" value={activeGroups} icon="👥" tint="lime" />
        <StatTile href="/achievements" label="Achievements" value={achievementCount} icon="🏅" tint="orange" />
        <StatTile href="/rewards" label="Points" value={progress.points} icon="🏆" tint="accent" />
      </div>

      <div className="flex flex-wrap gap-2">
        {(membership.role === "FOUNDER" || membership.role === "MODERATOR") && (
          <Link href="/class/settings">
            <Button variant="secondary" size="sm">
              Manage class
            </Button>
          </Link>
        )}
        {canManageSchool && (
          <Link href="/school/settings">
            <Button variant="secondary" size="sm">
              Manage school
            </Button>
          </Link>
        )}
        <LeaveClassButton classId={membership.classId} isFounder={membership.role === "FOUNDER"} />
      </div>

      <InviteCard
        className={membership.class.name}
        inviteCode={membership.class.inviteCode}
        memberCount={memberCount}
      />

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-faint">
          Your modules
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {enabledModules().map((m) => {
            const locked =
              m.minClassMembers != null && memberCount < m.minClassMembers;
            const tint = MODULE_TINT[m.id] ?? "accent";
            const tintClass =
              tint === "lime"
                ? "bg-brand-lime-soft text-brand-lime"
                : tint === "orange"
                  ? "bg-brand-orange-soft text-brand-orange"
                  : "bg-accent-soft text-accent";
            return (
              <Link key={m.id} href={locked ? "#" : m.href}>
                <Card className="transition duration ease hover:-translate-y-0.5 hover:shadow-sm">
                  <CardBody className="flex items-start gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl ${tintClass}`}>
                      {m.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{m.name}</p>
                        {locked && (
                          <Badge tone="warning">
                            🔒 {m.minClassMembers} members
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-subtle">
                        {m.description}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
