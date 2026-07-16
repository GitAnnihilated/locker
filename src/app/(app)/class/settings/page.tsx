import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { getActiveMembership, getClassMembers } from "@/core/membership/queries";
import { getSchool, getSchoolModerators } from "@/core/school/queries";
import {
  canManageClass,
  canGovernClass,
  canManageClassAsSchool,
  canGovernClassAsSchool,
} from "@/core/permissions/rules";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";
import { Button } from "@/ui/components/Button";
import { RenameClassForm } from "@/modules/class-settings/components/RenameClassForm";
import { InviteCodePanel } from "@/modules/class-settings/components/InviteCodePanel";
import { MemberRow } from "@/modules/class-settings/components/MemberRow";
import { ArchiveClassButton } from "@/modules/class-settings/components/ArchiveClassButton";

export default async function ClassSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const user = await requireUser();
  const { classId: requestedClassId } = await searchParams;

  // A school authority (see below) can land here via a `?classId=` link from
  // School Settings to manage a class they aren't a member of; everyone
  // else lands here without a classId and gets their own active class, same
  // as before.
  let klass: { id: string; name: string; founderId: string; inviteCode: string; schoolId: string } | null = null;
  if (requestedClassId) {
    klass = await db.class.findUnique({
      where: { id: requestedClassId },
      select: { id: true, name: true, founderId: true, inviteCode: true, schoolId: true },
    });
  } else {
    const membership = await getActiveMembership(user.id);
    if (membership) {
      klass = {
        id: membership.classId,
        name: membership.class.name,
        founderId: membership.class.founderId,
        inviteCode: membership.class.inviteCode,
        schoolId: membership.class.schoolId,
      };
    }
  }

  if (!klass) {
    return <EmptyState icon="🚪" title="Join a class first" />;
  }

  const members = await getClassMembers(klass.id);
  const moderatorIds = members.filter((m) => m.role === "MODERATOR").map((m) => m.userId);
  const klassCtx = { founderId: klass.founderId, moderatorUserIds: moderatorIds };

  let canManage = canManageClass(user.id, klassCtx);
  let isFounder = canGovernClass(user.id, klassCtx);

  // Only pay for the school-context lookup when class-native permission
  // fails — the common case (a class founder/moderator viewing their own
  // class) never needs it.
  if (!canManage) {
    const [school, schoolModerators] = await Promise.all([
      getSchool(klass.schoolId),
      getSchoolModerators(klass.schoolId),
    ]);
    const schoolCtx = school
      ? { founderId: school.founderId, moderatorUserIds: schoolModerators.map((m) => m.userId) }
      : { founderId: "", moderatorUserIds: [] };
    canManage = canManageClassAsSchool(user.id, schoolCtx);
    isFounder = canGovernClassAsSchool(user.id, schoolCtx);
  }

  if (!canManage) {
    return (
      <EmptyState
        icon="🔒"
        title="Founders & moderators only"
        description="Ask your class founder for access, or explore the other modules."
        action={
          <Link href="/dashboard">
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Class settings</h1>
        <p className="text-sm text-subtle">{klass.name}</p>
      </div>

      {isFounder && (
        <Card>
          <CardHeader className="font-semibold">Class name</CardHeader>
          <CardBody>
            <RenameClassForm classId={klass.id} currentName={klass.name} />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader className="font-semibold">Invite code</CardHeader>
        <CardBody>
          <p className="mb-3 text-sm text-subtle">
            Share this code or the class link with classmates. Generating a new
            code disables the old one — useful if it leaked.
          </p>
          <InviteCodePanel classId={klass.id} initialCode={klass.inviteCode} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="font-semibold">
          Members ({members.length})
        </CardHeader>
        <CardBody className="p-0">
          {members.map((m) => (
            <MemberRow
              key={m.id}
              classId={klass.id}
              member={m}
              viewerIsFounder={isFounder}
            />
          ))}
        </CardBody>
      </Card>

      {isFounder && (
        <Card className="border-danger/30">
          <CardHeader className="font-semibold text-danger">Danger zone</CardHeader>
          <CardBody>
            <p className="mb-3 text-sm text-subtle">
              Archiving hides the class from everyone&apos;s dashboard. Homework
              and history are preserved, not deleted.
            </p>
            <ArchiveClassButton classId={klass.id} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
