import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { getActiveMembership } from "@/core/membership/queries";
import { getMyCourses } from "@/modules/courses/queries";
import { CreateCourseForm } from "@/app/(app)/onboarding/_components/CreateCourseForm";
import { JoinByCodeForm } from "@/app/(app)/onboarding/_components/JoinByCodeForm";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";
import { Badge } from "@/ui/components/Badge";

export default async function CoursesPage() {
  const user = await requireUser();
  const [courses, activeMembership] = await Promise.all([
    getMyCourses(user.id),
    getActiveMembership(user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Courses</h1>

      {courses.length === 0 ? (
        <EmptyState icon="🎓" title="No courses yet" description="Join or create your first course below." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {courses.map((c) => (
            <Link key={c.classId} href={`/courses/${c.classId}`}>
              <Card className="h-full transition duration ease hover:-translate-y-0.5 hover:shadow-sm">
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{c.name}</p>
                    {c.role !== "STUDENT" && <Badge tone="accent">{c.role}</Badge>}
                  </div>
                  {c.courseCode && <p className="text-xs text-subtle">{c.courseCode}</p>}
                  {c.teacher && <p className="mt-1 text-xs text-subtle">{c.teacher.name}</p>}
                  <p className="mt-2 text-xs text-subtle">
                    {c.memberCount} student{c.memberCount === 1 ? "" : "s"} · {c.assignmentCount} assignment
                    {c.assignmentCount === 1 ? "" : "s"}
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {activeMembership && (
        <Card>
          <CardHeader className="font-semibold">Add another course</CardHeader>
          <CardBody className="space-y-4">
            <CreateCourseForm schoolId={activeMembership.schoolId} />
            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs font-medium text-subtle">Have an invite code instead?</p>
              <JoinByCodeForm />
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
