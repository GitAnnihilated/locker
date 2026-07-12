import { requireUser } from "@/core/auth/session";
import { getGroupDashboard, getGroupActivity, getMyPendingRequest } from "@/modules/groups/queries";
import { getGroupMessages } from "@/modules/groups/chat";
import { canGovernProject, canManageProject } from "@/modules/groups/permissions";
import { ProjectHeader } from "@/modules/groups/components/ProjectHeader";
import { DeletionVoteBanner } from "@/modules/groups/components/DeletionVoteBanner";
import { MemberRow } from "@/modules/groups/components/MemberRow";
import { JoinRequestCard } from "@/modules/groups/components/JoinRequestCard";
import { JoinRequestForm } from "@/modules/groups/components/JoinRequestForm";
import { TaskItem } from "@/modules/groups/components/TaskItem";
import { TaskForm } from "@/modules/groups/components/TaskForm";
import { ResourceItem } from "@/modules/groups/components/ResourceItem";
import { ResourceForm } from "@/modules/groups/components/ResourceForm";
import { ActivityFeed } from "@/modules/groups/components/ActivityFeed";
import { GroupChat } from "@/modules/groups/components/GroupChat";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { ProgressBar } from "@/ui/components/ProgressBar";
import { EmptyState } from "@/ui/components/EmptyState";

export default async function GroupDashboardPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const user = await requireUser();
  const group = await getGroupDashboard(groupId);

  if (!group || group.deletedAt) {
    return <EmptyState icon="🔍" title="Project not found" />;
  }

  const viewerMembership = group.members.find((m) => m.userId === user.id);

  // Non-members see a preview: who's in it, what it's about, and a way to
  // request in. Tasks/resources/activity stay private to the team.
  if (!viewerMembership) {
    const pendingRequest = await getMyPendingRequest(groupId, user.id);
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <ProjectHeader group={group} canManage={false} canGovern={false} />

        <Card>
          <CardHeader className="font-semibold">Members ({group.members.length})</CardHeader>
          <CardBody className="p-0">
            {group.members.map((m) => (
              <MemberRow key={m.id} groupId={group.id} member={m} viewerIsLeader={false} />
            ))}
          </CardBody>
        </Card>

        {pendingRequest ? (
          <Card>
            <CardBody className="text-center text-sm text-subtle">
              Your request to join is pending review.
            </CardBody>
          </Card>
        ) : (
          <JoinRequestForm groupId={group.id} />
        )}
      </div>
    );
  }

  const canManage = canManageProject(viewerMembership.role);
  const canGovern = canGovernProject(viewerMembership.role);
  const [activities, messages] = await Promise.all([
    getGroupActivity(groupId),
    getGroupMessages(groupId),
  ]);
  const openVote = group.deletionVotes[0];

  return (
    <div className="space-y-6">
      <ProjectHeader group={group} canManage={canManage} canGovern={canGovern} isMember />

      {(openVote || canGovern) && (
        <DeletionVoteBanner
          groupId={group.id}
          openVote={openVote}
          memberCount={group.members.length}
          viewerId={user.id}
          viewerIsLeader={canGovern}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <GroupChat groupId={group.id} viewerId={user.id} initialMessages={messages} />

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Progress</p>
                <p className="text-sm font-semibold text-accent">{group.progressPct}%</p>
              </div>
              <ProgressBar pct={group.progressPct} className="mt-2" />
              <p className="mt-2 text-xs text-subtle">
                {group.completedTasks} of {group.totalTasks} tasks complete
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="font-semibold">Tasks</CardHeader>
            {group.tasks.length === 0 ? (
              <div className="p-4">
                <EmptyState icon="✅" title="No tasks yet" />
              </div>
            ) : (
              <div>
                {group.tasks.map((t) => (
                  <TaskItem key={t.id} task={t} canManage={canManage} />
                ))}
              </div>
            )}
            {canManage && <TaskForm groupId={group.id} members={group.members} />}
          </Card>

          <Card>
            <CardHeader className="font-semibold">Resources</CardHeader>
            {group.resources.length === 0 ? (
              <div className="p-4">
                <EmptyState icon="📎" title="No resources shared yet" />
              </div>
            ) : (
              <div>
                {group.resources.map((r) => (
                  <ResourceItem key={r.id} resource={r} canRemove={canManage || r.uploaderId === user.id} />
                ))}
              </div>
            )}
            <ResourceForm groupId={group.id} />
          </Card>
        </div>

        <aside className="space-y-6">
          {canManage && group.joinRequests.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-subtle">
                Join requests ({group.joinRequests.length})
              </p>
              {group.joinRequests.map((r) => (
                <JoinRequestCard key={r.id} request={r} />
              ))}
            </div>
          )}

          <Card>
            <CardHeader className="font-semibold">Members ({group.members.length})</CardHeader>
            <CardBody className="p-0">
              {group.members.map((m) => (
                <MemberRow key={m.id} groupId={group.id} member={m} viewerIsLeader={canGovern} />
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="font-semibold">Recent activity</CardHeader>
            <ActivityFeed activities={activities} />
          </Card>
        </aside>
      </div>
    </div>
  );
}
