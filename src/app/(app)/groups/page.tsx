import { requireUser } from "@/core/auth/session";
import { getActiveMembership } from "@/core/membership/queries";
import { getClassGroups } from "@/modules/groups/queries";
import { GroupCard } from "@/modules/groups/components/GroupCard";
import { CreateGroupDialog } from "@/modules/groups/components/CreateGroupDialog";
import { EmptyState } from "@/ui/components/EmptyState";

export default async function GroupsPage() {
  const user = await requireUser();
  const membership = await getActiveMembership(user.id);
  if (!membership) {
    return <EmptyState icon="🚪" title="Join a class to find project groups" />;
  }

  const groups = await getClassGroups(membership.classId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Group Finder</h1>
          <p className="text-sm text-subtle">
            Project workspaces for {membership.class.name} — organize, share, and track together.
          </p>
        </div>
        <CreateGroupDialog existingGroups={groups} />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No projects yet"
          description="Start one — you'll be the Leader and can invite classmates to join."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      )}
    </div>
  );
}
