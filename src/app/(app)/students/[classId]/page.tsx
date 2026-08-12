import Link from "next/link";
import { requireDbUser } from "@/core/auth/session";
import { requireClassTeacher } from "@/core/permissions/guards";
import { db } from "@/core/db/client";
import { Card, CardBody } from "@/ui/components/Card";
import { Badge } from "@/ui/components/Badge";
import { Avatar } from "@/ui/components/Avatar";
import { EmptyState } from "@/ui/components/EmptyState";
import { getClassRosterWithFollowUp } from "@/modules/notebook/queries";

/**
 * The roster IS the follow-up view: incomplete-homework count is read
 * straight off existing Homework/HomeworkStatus data — no separate
 * "follow-ups" feature needed, no new logging for the teacher to do.
 */
export default async function ClassRosterPage({ params }: { params: Promise<{ classId: string }> }) {
  const user = await requireDbUser();
  const { classId } = await params;

  try {
    await requireClassTeacher(user.id, classId);
  } catch {
    return (
      <EmptyState
        icon="🔒"
        title="This class's teacher only"
        description="You can only see the roster for classes you teach."
      />
    );
  }

  const [klass, roster] = await Promise.all([
    db.class.findUniqueOrThrow({ where: { id: classId }, select: { name: true, subject: true } }),
    getClassRosterWithFollowUp(classId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/students" className="text-xs text-subtle hover:underline">
          ← All classes
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {klass.subject ? `${klass.subject} — ${klass.name}` : klass.name}
        </h1>
        <p className="mt-1 text-sm text-subtle">{roster.length} student{roster.length === 1 ? "" : "s"}</p>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {roster.map((r) => (
          <Link
            key={r.userId}
            href={`/students/${classId}/${r.userId}`}
            className="flex items-center justify-between gap-3 p-4 transition duration ease hover:bg-muted/60"
          >
            <div className="flex items-center gap-3">
              <Avatar name={r.user.name} image={r.user.image} size={32} />
              <span className="font-medium">{r.user.name}</span>
            </div>
            {r.incompleteCount > 0 ? (
              <Badge tone="warning">{r.incompleteCount} incomplete</Badge>
            ) : (
              <Badge tone="success">All caught up</Badge>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
