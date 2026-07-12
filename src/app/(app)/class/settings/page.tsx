import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { getActiveMembership, getClassMembers } from "@/core/membership/queries";
import { canManageClass, canGovernClass } from "@/core/permissions/rules";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";
import { Button } from "@/ui/components/Button";
import { RenameClassForm } from "@/modules/class-settings/components/RenameClassForm";
import { InviteCodePanel } from "@/modules/class-settings/components/InviteCodePanel";
import { MemberRow } from "@/modules/class-settings/components/MemberRow";
import { ArchiveClassButton } from "@/modules/class-settings/components/ArchiveClassButton";

export default async function ClassSettingsPage() {
  const user = await requireUser();
  const membership = await getActiveMembership(user.id);

  if (!membership) {
    return <EmptyState icon="🚪" title="Join a class first" />;
  }

  const members = await getClassMembers(membership.classId);
  const moderatorIds = members.filter((m) => m.role === "MODERATOR").map((m) => m.userId);
  const klassCtx = { founderId: membership.class.founderId, moderatorUserIds: moderatorIds };

  const canManage = canManageClass(user.id, klassCtx);
  const isFounder = canGovernClass(user.id, klassCtx);

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
        <p className="text-sm text-subtle">{membership.class.name}</p>
      </div>

      {isFounder && (
        <Card>
          <CardHeader className="font-semibold">Class name</CardHeader>
          <CardBody>
            <RenameClassForm classId={membership.classId} currentName={membership.class.name} />
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
          <InviteCodePanel classId={membership.classId} initialCode={membership.class.inviteCode} />
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
              classId={membership.classId}
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
            <ArchiveClassButton classId={membership.classId} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
