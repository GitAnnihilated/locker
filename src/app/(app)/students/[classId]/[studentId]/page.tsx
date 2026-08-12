import Link from "next/link";
import { requireDbUser } from "@/core/auth/session";
import { requireClassTeacher } from "@/core/permissions/guards";
import { db } from "@/core/db/client";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { Badge } from "@/ui/components/Badge";
import { Avatar } from "@/ui/components/Avatar";
import { EmptyState } from "@/ui/components/EmptyState";
import {
  getStudentNotes,
  getStudentHomeworkHistory,
  getAchievementsToVerify,
  getVerifiedAchievements,
} from "@/modules/notebook/queries";
import { AddNoteForm } from "@/modules/notebook/components/AddNoteForm";
import { NoteList } from "@/modules/notebook/components/NoteList";
import { VerifyAchievementRow } from "@/modules/notebook/components/VerifyAchievementRow";

/**
 * The Student Notebook — one page per student, combining everything a
 * teacher currently has to reconstruct from memory or a personal
 * notebook at report-card time: logged observations, homework follow-up
 * (read off existing data, no new logging), and achievements awaiting
 * verification. Deliberately not a gradebook or attendance record — see
 * the module comment on StudentNote in prisma/schema.prisma.
 */
export default async function StudentNotebookPage({
  params,
}: {
  params: Promise<{ classId: string; studentId: string }>;
}) {
  const user = await requireDbUser();
  const { classId, studentId } = await params;

  try {
    await requireClassTeacher(user.id, classId);
  } catch {
    return (
      <EmptyState
        icon="🔒"
        title="This class's teacher only"
        description="You can only open the notebook for students in a class you teach."
      />
    );
  }

  const membership = await db.membership.findUnique({
    where: { userId_classId: { userId: studentId, classId } },
    select: { user: { select: { name: true, image: true } } },
  });
  if (!membership) {
    return <EmptyState icon="🚪" title="Not in this class" description="That student isn't a member of this class." />;
  }

  const [notes, homework, toVerify, verified] = await Promise.all([
    getStudentNotes(classId, studentId),
    getStudentHomeworkHistory(classId, studentId),
    getAchievementsToVerify(studentId),
    getVerifiedAchievements(studentId),
  ]);

  const incomplete = homework.filter((h) => !h.done);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/students/${classId}`} className="text-xs text-subtle hover:underline">
          ← Roster
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <Avatar name={membership.user.name} image={membership.user.image} size={40} />
          <h1 className="text-2xl font-bold">{membership.user.name}</h1>
        </div>
      </div>

      <Card>
        <CardHeader className="font-semibold">Homework follow-up</CardHeader>
        <CardBody>
          {incomplete.length === 0 ? (
            <p className="text-sm text-success">All caught up — nothing outstanding.</p>
          ) : (
            <ul className="space-y-2">
              {incomplete.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    {h.subject ? `${h.subject} — ` : ""}
                    {h.title}
                  </span>
                  {h.dueAt && <span className="text-xs text-faint">Due {new Date(h.dueAt).toLocaleDateString()}</span>}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-faint">
            {homework.length - incomplete.length} of {homework.length} homework items done.
          </p>
        </CardBody>
      </Card>

      {toVerify.length > 0 && (
        <Card>
          <CardHeader className="font-semibold">Achievements to review</CardHeader>
          <CardBody>
            <ul className="space-y-2">
              {toVerify.map((a) => (
                <VerifyAchievementRow key={a.id} achievement={a} classId={classId} />
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {verified.length > 0 && (
        <Card>
          <CardHeader className="font-semibold">Verified achievements</CardHeader>
          <CardBody>
            <ul className="space-y-2">
              {verified.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>{a.title}</span>
                  <Badge tone="success">Verified</Badge>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader className="font-semibold">Add a note</CardHeader>
        <CardBody>
          <AddNoteForm classId={classId} studentId={studentId} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="font-semibold">Notes ({notes.length})</CardHeader>
        <CardBody>
          <NoteList notes={notes} currentUserId={user.id} />
        </CardBody>
      </Card>
    </div>
  );
}
