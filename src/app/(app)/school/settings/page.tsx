import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { getActiveMembership } from "@/core/membership/queries";
import {
  getSchool,
  getManagedSchool,
  getSchoolModerators,
  getSchoolClassesForModeration,
  getSchoolStaff,
} from "@/core/school/queries";
import {
  editSchoolInfo,
  assignSchoolModerator,
  transferSchoolOwnership,
} from "@/core/school/actions";
import { canAccessSchoolSettings, isSchoolFounder } from "@/core/permissions/rules";
import { db } from "@/core/db/client";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";
import { Button } from "@/ui/components/Button";
import { EditSchoolNameForm } from "@/modules/school-settings/components/EditSchoolNameForm";
import { EmailActionForm } from "@/modules/school-settings/components/EmailActionForm";
import { ModeratorRow } from "@/modules/school-settings/components/ModeratorRow";
import { ClassModerationRow } from "@/modules/school-settings/components/ClassModerationRow";
import { StaffCodePanel } from "@/modules/school-settings/components/StaffCodePanel";

export default async function SchoolSettingsPage() {
  const user = await requireUser();

  // Resolve the school this user actually has authority over first (founder
  // or moderator), independent of their current active class — a School
  // Founder shouldn't get locked out just because their most recently
  // joined class is in a different school, or because they have no class
  // membership at all. Only fall back to "the school of my active class"
  // for the access-denied empty state below, so the message can still name
  // a school when a non-manager lands here.
  let school = await getManagedSchool(user.id);
  if (!school) {
    const membership = await getActiveMembership(user.id);
    if (membership) school = await getSchool(membership.schoolId);
  }

  if (!school) {
    return <EmptyState icon="🚪" title="Join a class first" />;
  }

  const [moderators, founderUser] = await Promise.all([
    getSchoolModerators(school.id),
    db.user.findUnique({ where: { id: school.founderId }, select: { role: true } }),
  ]);
  // A school founded by a PRINCIPAL is a real SCHOOL institution — that's
  // only ever possible post role-gating (see requirePrincipal in
  // core/school/actions.ts), so it's a reliable signal, same idea as
  // Class.teacherId marking a teacher-owned class.
  const isPrincipalGoverned = founderUser?.role === "PRINCIPAL";
  const schoolCtx = {
    founderId: school.founderId,
    moderatorUserIds: moderators.map((m) => m.userId),
  };
  const canAccess = canAccessSchoolSettings(user.id, schoolCtx);
  const isFounder = isSchoolFounder(user.id, schoolCtx);

  if (!canAccess) {
    return (
      <EmptyState
        icon="🔒"
        title={isPrincipalGoverned ? "This school's Principal only" : "School founders & moderators only"}
        description={
          isPrincipalGoverned
            ? "Teachers manage their own class from Class Settings, but school-wide settings belong to the Principal — by design."
            : "Class Founders manage their own class from Class Settings, but school-wide settings are separate — by design."
        }
        action={
          <Link href="/dashboard">
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
        }
      />
    );
  }

  const [classes, staff] = await Promise.all([
    getSchoolClassesForModeration(school.id),
    isPrincipalGoverned ? getSchoolStaff(school.id) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">School settings</h1>
        <p className="text-sm text-subtle">{school.name}</p>
      </div>

      {isFounder && (
        <Card>
          <CardHeader className="font-semibold">School name</CardHeader>
          <CardBody>
            <EditSchoolNameForm schoolId={school.id} currentName={school.name} />
          </CardBody>
        </Card>
      )}

      {isFounder && isPrincipalGoverned && school.teacherInviteCode && (
        <Card>
          <CardHeader className="font-semibold">Staff code</CardHeader>
          <CardBody>
            <p className="mb-3 text-sm text-subtle">
              Share this with your teachers — they redeem it once to join {school.name} as staff, which is what lets
              them create or join a class here at all. Generating a new code disables the old one.
            </p>
            <StaffCodePanel schoolId={school.id} initialCode={school.teacherInviteCode} />
            {staff.length > 0 && (
              <ul className="mt-4 divide-y divide-border border-t border-border pt-2">
                {staff.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                    <span>{s.user.name ?? s.user.email}</span>
                    <span className="text-xs text-faint">Joined {new Date(s.joinedAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader className="font-semibold">
          Classes ({classes.length})
        </CardHeader>
        <CardBody className="p-0">
          <p className="px-4 pt-3 text-xs text-subtle">
            {isPrincipalGoverned
              ? "Only teachers and the Principal can create a class here — moderation below is for removing spam after the fact, not a gate before it happens."
              : "Classes launch instantly when a student creates them — moderation here is for removing spam after the fact, never a gate before students can use Locker."}
          </p>
          <div className="mt-2">
            {classes.map((c) => (
              <ClassModerationRow key={c.id} schoolId={school.id} klass={c} />
            ))}
          </div>
        </CardBody>
      </Card>

      {isFounder && (
        <>
          <Card>
            <CardHeader className="font-semibold">
              {isPrincipalGoverned ? "Staff moderators" : "School moderators"} ({moderators.length})
            </CardHeader>
            <CardBody className="p-0">
              {moderators.map((m) => (
                <ModeratorRow key={m.id} schoolId={school.id} moderator={m} />
              ))}
              <div className="p-4">
                <EmailActionForm
                  schoolId={school.id}
                  action={assignSchoolModerator}
                  placeholder={isPrincipalGoverned ? "teacher@school.edu" : "classmate@school.edu"}
                  buttonLabel="Add moderator"
                />
              </div>
            </CardBody>
          </Card>

          <Card className="border-danger/30">
            <CardHeader className="font-semibold text-danger">
              Transfer {isPrincipalGoverned ? "Principal role" : "ownership"}
            </CardHeader>
            <CardBody>
              <p className="mb-3 text-sm text-subtle">
                {isPrincipalGoverned
                  ? "Hands Principal control to another member of this school. This cannot be undone by you — only the new Principal can transfer it back."
                  : "Hands School Founder control to another member of this school. This cannot be undone by you — only the new founder can transfer it back."}
              </p>
              <EmailActionForm
                schoolId={school.id}
                action={transferSchoolOwnership}
                placeholder={isPrincipalGoverned ? "new-principal@school.edu" : "new-founder@school.edu"}
                buttonLabel="Transfer"
                buttonVariant="danger"
                confirmMessage={
                  isPrincipalGoverned
                    ? "Transfer the Principal role? You will no longer manage this school."
                    : "Transfer school ownership? You will no longer be the School Founder."
                }
              />
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
