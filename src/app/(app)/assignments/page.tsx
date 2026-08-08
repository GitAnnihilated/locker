import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { getMyAssignments } from "@/modules/courses/queries";
import { HomeworkItem } from "@/modules/homework/components/HomeworkItem";
import { Card, CardBody } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";
import { Badge } from "@/ui/components/Badge";

/**
 * The College equivalent of /homework, but cross-course — a college student
 * has many courses, not one class, so this is a new aggregate view rather
 * than a relabeled copy of the school board. Reuses HomeworkItem (and its
 * toggleDone/confirmHomework actions) as-is — an assignment IS a Homework row.
 */
export default async function AssignmentsPage() {
  const user = await requireUser();
  const assignments = await getMyAssignments(user.id);
  const pending = assignments.filter((a) => !a.done);
  const done = assignments.filter((a) => a.done);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Assignments</h1>

      {assignments.length === 0 ? (
        <EmptyState icon="📚" title="No assignments yet" description="Assignments from your courses will show up here." />
      ) : (
        <>
          <Card>
            <CardBody className="p-0">
              {pending.length === 0 ? (
                <p className="p-4 text-sm text-subtle">Nothing due — you&apos;re all caught up.</p>
              ) : (
                pending.map((item) => (
                  <div key={item.id}>
                    <div className="flex items-center gap-2 px-5 pt-3 text-xs text-subtle">
                      <Badge tone="neutral">{item.course.courseCode ?? item.course.name}</Badge>
                    </div>
                    <HomeworkItem item={item} />
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          {done.length > 0 && (
            <Card>
              <CardBody className="p-0">
                {done.map((item) => (
                  <div key={item.id}>
                    <div className="flex items-center gap-2 px-5 pt-3 text-xs text-subtle">
                      <Badge tone="neutral">{item.course.courseCode ?? item.course.name}</Badge>
                    </div>
                    <HomeworkItem item={item} />
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </>
      )}

      <Link href="/courses" className="block text-center text-sm font-medium text-accent hover:underline">
        Add an assignment from a specific course →
      </Link>
    </div>
  );
}
