import { requireUser } from "@/core/auth/session";
import { getMyGroupsByKind } from "@/modules/courses/queries";
import { getMyCourses } from "@/modules/courses/queries";
import { GroupCard } from "@/modules/groups/components/GroupCard";
import { CreateKindGroupForm } from "@/modules/courses/components/CreateKindGroupForm";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";

/**
 * College's Project Groups — Group Finder's own /groups/[groupId] detail
 * page (chat, tasks, resources, members, deletion vote — all of it) is
 * reused unchanged; this is just a cross-course PROJECT-kind list + a
 * course-aware create form.
 */
export default async function ProjectGroupsPage() {
  const user = await requireUser();
  const [groups, courses] = await Promise.all([
    getMyGroupsByKind(user.id, "PROJECT"),
    getMyCourses(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Project Groups</h1>
        <p className="text-sm text-subtle">Team up with classmates to get a project done.</p>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon="👥" title="No project groups yet" description="Start one below — you'll be the Leader." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="font-semibold">Start a project group</CardHeader>
        <CardBody>
          <CreateKindGroupForm courses={courses} kind="PROJECT" />
        </CardBody>
      </Card>
    </div>
  );
}
