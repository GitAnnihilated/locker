import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { getActiveMembership } from "@/core/membership/queries";
import {
  getSchool,
  getManagedSchool,
  getSchoolModerators,
  getSchoolClassesForModeration,
} from "@/core/school/queries";
import {
  editSchoolInfo,
  assignSchoolModerator,
  transferSchoolOwnership,
} from "@/core/school/actions";
import { canAccessSchoolSettings, isSchoolFounder } from "@/core/permissions/rules";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";
import { Button } from "@/ui/components/Button";
import { EditSchoolNameForm } from "@/modules/school-settings/components/EditSchoolNameForm";
import { EmailActionForm } from "@/modules/school-settings/components/EmailActionForm";
import { ModeratorRow } from "@/modules/school-settings/components/ModeratorRow";
import { ClassModerationRow } from "@/modules/school-settings/components/ClassModerationRow";

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

  const moderators = await getSchoolModerators(school.id);
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
        title="School founders & moderators only"
        description="Class Founders manage their own class from Class Settings, but school-wide settings are separate — by design."
        action={
          <Link href="/dashboard">
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
        }
      />
    );
  }

  const classes = await getSchoolClassesForModeration(school.id);

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

      <Card>
        <CardHeader className="font-semibold">
          Classes ({classes.length})
        </CardHeader>
        <CardBody className="p-0">
          <p className="px-4 pt-3 text-xs text-subtle">
            Classes launch instantly when a student creates them — moderation
            here is for removing spam after the fact, never a gate before students can use Locker.
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
              School moderators ({moderators.length})
            </CardHeader>
            <CardBody className="p-0">
              {moderators.map((m) => (
                <ModeratorRow key={m.id} schoolId={school.id} moderator={m} />
              ))}
              <div className="p-4">
                <EmailActionForm
                  schoolId={school.id}
                  action={assignSchoolModerator}
                  placeholder="classmate@school.edu"
                  buttonLabel="Add moderator"
                />
              </div>
            </CardBody>
          </Card>

          <Card className="border-danger/30">
            <CardHeader className="font-semibold text-danger">
              Transfer ownership
            </CardHeader>
            <CardBody>
              <p className="mb-3 text-sm text-subtle">
                Hands School Founder control to another member of this school.
                This cannot be undone by you — only the new founder can transfer it back.
              </p>
              <EmailActionForm
                schoolId={school.id}
                action={transferSchoolOwnership}
                placeholder="new-founder@school.edu"
                buttonLabel="Transfer"
                buttonVariant="danger"
                confirmMessage="Transfer school ownership? You will no longer be the School Founder."
              />
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
