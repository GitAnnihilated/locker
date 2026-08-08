import { requireUser } from "@/core/auth/session";
import { getMyGroupsByKind, getMyCourses } from "@/modules/courses/queries";
import { GroupCard } from "@/modules/groups/components/GroupCard";
import { CreateKindGroupForm } from "@/modules/courses/components/CreateKindGroupForm";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";

/**
 * Deliberately the SAME Group model/detail page as Project Groups (kind
 * distinguishes them) but a genuinely different purpose: a study group
 * exists to learn/revise together, not to ship a deliverable.
 */
export default async function StudyGroupsPage() {
  const user = await requireUser();
  const [groups, courses] = await Promise.all([
    getMyGroupsByKind(user.id, "STUDY"),
    getMyCourses(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Study Groups</h1>
        <p className="text-sm text-subtle">Find people to revise and learn with.</p>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon="📖" title="No study groups yet" description="Start one below, or find one from a course page." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="font-semibold">Start a study group</CardHeader>
        <CardBody>
          <CreateKindGroupForm courses={courses} kind="STUDY" />
        </CardBody>
      </Card>
    </div>
  );
}
