import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { db } from "@/core/db/client";
import {
  getActiveMembership,
  getClassMemberCount,
} from "@/core/membership/queries";
import { getManagedSchool } from "@/core/school/queries";
import { enabledModules } from "@/core/modules/registry";
import { getPendingHomeworkCount } from "@/modules/homework/queries";
import { getMyActiveGroupCount } from "@/modules/groups/queries";
import { getPendingAssignmentsCount, getMyGroupCountByKind } from "@/modules/courses/queries";
import { getAchievementCount } from "@/modules/achievements/queries";
import { getProgressSummary } from "@/core/rewards/queries";
import { getTerminology } from "@/core/education/config";
import { Card, CardBody } from "@/ui/components/Card";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { EmptyState } from "@/ui/components/EmptyState";
import { StatTile } from "@/ui/components/StatTile";
import { InviteCard } from "@/modules/invites/components/InviteCard";
import { LeaveClassButton } from "@/modules/invites/components/LeaveClassButton";
import { getTeacherClasses } from "@/modules/ptm/queries";

const MODULE_TINT: Record<string, "accent" | "lime" | "orange"> = {
  homework: "accent",
  marketplace: "orange",
  groups: "lime",
  achievements: "accent",
  rewards: "orange",
  messages: "lime",
  courses: "accent",
  assignments: "accent",
  "project-groups": "lime",
  "study-groups": "lime",
  "campus-marketplace": "orange",
  notes: "accent",
  clubs: "orange",
  events: "lime",
  classmates: "accent",
  ptm: "lime",
  tasks: "accent",
};

export default async function DashboardPage() {
  const user = await requireUser();
  // Name/nickname live in the DB, not the JWT — see core/auth/auth.ts — so a
  // freshly-completed Profile Setup shows up immediately, not after re-login.
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true, nickname: true, educationType: true, role: true },
  });
  const displayName = dbUser?.nickname || dbUser?.name;
  const educationType = dbUser?.educationType ?? "SCHOOL";
  const isCollege = educationType === "COLLEGE";
  const t = getTerminology(educationType);
  const isTeacher = !isCollege && (dbUser?.role === "TEACHER" || dbUser?.role === "PRINCIPAL");
  const isStudent = (dbUser?.role ?? "STUDENT") === "STUDENT";
  const [membership, teacherClasses] = await Promise.all([
    getActiveMembership(user.id),
    isTeacher ? getTeacherClasses(user.id) : Promise.resolve([]),
  ]);

  if (!membership) {
    // Still check for school authority — a School Founder with no class
    // membership yet (or whose only class is elsewhere) shouldn't be
    // stranded with no way to reach the school they founded.
    const managedSchool = await getManagedSchool(user.id);
    return (
      <EmptyState
        icon="👋"
        title={`Welcome, ${displayName?.split(" ")[0] ?? "student"}!`}
        description={
          managedSchool
            ? `You manage ${managedSchool.name}. Join a ${t.classUnit.toLowerCase()} to unlock the rest of Locker.`
            : `Join your ${t.classUnit.toLowerCase()} to unlock everything Locker can do.`
        }
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link href="/onboarding">
              <Button>Get started</Button>
            </Link>
            {managedSchool && (
              <Link href="/school/settings">
                <Button variant="secondary">Manage {managedSchool.name}</Button>
              </Link>
            )}
          </div>
        }
      />
    );
  }

  // College's "Due"/"Active" tiles are cross-course aggregates (a college
  // student has many courses, not one class) — School's are single-class
  // counts, unchanged. Both cost one query either way, just a different one.
  const [memberCount, managedSchool, pendingWork, activeGroups, achievementCount, progress] = await Promise.all([
    getClassMemberCount(membership.classId),
    getManagedSchool(user.id),
    isCollege ? getPendingAssignmentsCount(user.id) : getPendingHomeworkCount(membership.classId, user.id),
    isCollege ? getMyGroupCountByKind(user.id, "PROJECT") : getMyActiveGroupCount(membership.classId, user.id),
    getAchievementCount(user.id),
    getProgressSummary(user.id),
  ]);

  const canManageSchool = managedSchool != null;

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
          {/* Gamification (streaks/levels/points) is a student-motivation
              layer, not something a teacher/principal's account earns. */}
          {isStudent && progress.currentStreak > 0 && (
            <Badge tone="warning">🔥 {progress.currentStreak}-day streak</Badge>
          )}
          {isStudent && <Badge tone="accent">⭐ Lv. {progress.level}</Badge>}
          <Badge tone={membership.role === "FOUNDER" ? "accent" : membership.role === "MODERATOR" ? "success" : "neutral"}>
            {membership.role === "FOUNDER" && membership.class.teacherId ? "TEACHER" : membership.role}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatTile
          href={isCollege ? "/assignments" : "/homework"}
          label="Due"
          value={pendingWork}
          icon="📚"
          tint="accent"
        />
        <StatTile
          href={isCollege ? "/project-groups" : "/groups"}
          label="Active projects"
          value={activeGroups}
          icon="👥"
          tint="lime"
        />
        <StatTile href="/achievements" label="Achievements" value={achievementCount} icon="🏅" tint="orange" />
        {isStudent && <StatTile href="/rewards" label="Points" value={progress.points} icon="🏆" tint="accent" />}
      </div>

      <div className="flex flex-wrap gap-2">
        {(membership.role === "FOUNDER" || membership.role === "MODERATOR") && (
          <Link href="/class/settings">
            <Button variant="secondary" size="sm">
              {t.manageClassLabel}
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
        {/* A SCHOOL class's teacher can't "leave" it into a student's hands
            (see core/membership/actions.ts's leaveClass) — archiving from
            Class Settings is the real off-ramp, so the button just doesn't
            apply to them. */}
        {!(membership.role === "FOUNDER" && membership.class.teacherId) && (
          <LeaveClassButton classId={membership.classId} isFounder={membership.role === "FOUNDER"} />
        )}
      </div>

      <InviteCard
        className={membership.class.name}
        inviteCode={membership.class.inviteCode}
        memberCount={memberCount}
        viewerIsTeacher={membership.role === "FOUNDER" && membership.class.teacherId != null}
      />

      {isTeacher && teacherClasses.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-faint">
            My classes
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {teacherClasses.map((c) => (
              <Card key={c.id}>
                <CardBody className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{c.subject ? `${c.subject} — ${c.name}` : c.name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link href={`/students/${c.id}`}>
                      <Button variant="secondary" size="sm">
                        Roster
                      </Button>
                    </Link>
                    <Link href={`/ptm?class=${c.id}`}>
                      <Button variant="secondary" size="sm">
                        PTM slots
                      </Button>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-faint">
          Your modules
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {enabledModules(educationType, dbUser?.role ?? "STUDENT").map((m) => {
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
