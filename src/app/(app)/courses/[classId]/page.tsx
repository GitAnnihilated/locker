import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { getCourseForMember, getCourseGroups } from "@/modules/courses/queries";
import { getClassMessages } from "@/modules/courses/chat";
import { getHomeworkBoard } from "@/modules/homework/queries";
import { getCourseResources } from "@/modules/notes/queries";
import { getClassMembers } from "@/core/membership/queries";
import { CourseChat } from "@/modules/courses/components/CourseChat";
import { CourseAssignmentForm } from "@/modules/courses/components/CourseAssignmentForm";
import { HomeworkItem } from "@/modules/homework/components/HomeworkItem";
import { ClassResourceForm } from "@/modules/notes/components/ClassResourceForm";
import { ClassResourceItem } from "@/modules/notes/components/ClassResourceItem";
import { Avatar } from "@/ui/components/Avatar";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { EmptyState } from "@/ui/components/EmptyState";

export default async function CourseDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const user = await requireUser();

  const course = await getCourseForMember(classId, user.id);
  if (!course) {
    return <EmptyState icon="🚪" title="Not enrolled in this course" description="Join with an invite code from Courses." />;
  }

  const [assignments, resources, messages, studyGroups, members] = await Promise.all([
    getHomeworkBoard(classId, user.id),
    getCourseResources(classId),
    getClassMessages(classId),
    getCourseGroups(classId, "STUDY"),
    getClassMembers(classId),
  ]);

  const isFounder = course.membership.role === "FOUNDER" || course.membership.role === "MODERATOR";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{course.class.name}</h1>
          <p className="mt-1 text-sm text-subtle">
            {course.class.courseCode && `${course.class.courseCode} · `}
            {course.class._count.memberships} student{course.class._count.memberships === 1 ? "" : "s"}
            {course.class.teacher && ` · ${course.class.teacher.name}`}
          </p>
        </div>
        {isFounder && (
          <Link href={`/class/settings?classId=${classId}`}>
            <Button variant="secondary" size="sm">Manage course</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader className="font-semibold">Assignments ({assignments.length})</CardHeader>
        <CardBody className="p-0">
          {assignments.length === 0 ? (
            <p className="p-4 text-sm text-subtle">No assignments yet.</p>
          ) : (
            assignments.map((item) => <HomeworkItem key={item.id} item={item} canManage={isFounder} />)
          )}
        </CardBody>
        <div className="border-t border-border p-4">
          <CourseAssignmentForm classId={classId} />
        </div>
      </Card>

      <CourseChat
        classId={classId}
        viewerId={user.id}
        viewerName={user.name}
        viewerImage={user.image}
        initialMessages={messages}
      />

      <Card>
        <CardHeader className="font-semibold">Notes & resources ({resources.length})</CardHeader>
        <CardBody className="p-0">
          {resources.length === 0 ? (
            <p className="p-4 text-sm text-subtle">No resources shared yet.</p>
          ) : (
            resources.map((r) => <ClassResourceItem key={r.id} resource={r} viewerId={user.id} />)
          )}
        </CardBody>
        <ClassResourceForm classId={classId} />
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between font-semibold">
          Study groups ({studyGroups.length})
          <Link href="/study-groups" className="text-xs font-medium text-accent hover:underline">
            All study groups →
          </Link>
        </CardHeader>
        <CardBody className="p-0">
          {studyGroups.length === 0 ? (
            <p className="p-4 text-sm text-subtle">No study groups for this course yet.</p>
          ) : (
            studyGroups.map((g) => (
              <div key={g.id} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0">
                <div>
                  <p className="text-sm font-medium">{g.name}</p>
                  <p className="text-xs text-subtle">{g.members.length} member{g.members.length === 1 ? "" : "s"}</p>
                </div>
                <div className="flex -space-x-2">
                  {g.members.slice(0, 4).map((m) => (
                    <Avatar key={m.id} name={m.user.nickname || m.user.name} image={m.user.image} size={24} className="ring-2 ring-surface" />
                  ))}
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="font-semibold">Classmates ({members.length})</CardHeader>
        <CardBody className="flex flex-wrap gap-3 p-4">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <Avatar name={m.user.name} image={m.user.image} size={28} frame={m.user.avatarFrame} />
              <div>
                <p className="text-sm font-medium">{m.user.name ?? m.user.email}</p>
                {m.role !== "STUDENT" && <Badge tone="neutral">{m.role}</Badge>}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
