import Link from "next/link";
import { requireDbUser } from "@/core/auth/session";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";
import { getTeacherClasses } from "@/modules/ptm/queries";
import {
  getJoinableClassesForTeacher,
  getTaughtClassesWithSchool,
  getClassGroupsForTeacher,
} from "@/modules/classes/queries";
import { JoinClassForm } from "@/modules/classes/components/JoinClassForm";
import { CreateGroupForm } from "@/modules/classes/components/CreateGroupForm";

/**
 * The teacher hub for everything class-membership-shaped: which classes
 * you already teach, which OTHER classes in your own school you can join
 * (see joinClassAsTeacher — never any school you merely found in search),
 * and compound classes (ClassGroup) bundling several of your own classes
 * into one unit.
 */
export default async function ClassesPage() {
  const user = await requireDbUser();

  if (user.role === "STUDENT") {
    return (
      <EmptyState
        icon="🧑‍🏫"
        title="Teachers and Principals only"
        description="Students join a class with an invite code from their teacher instead."
      />
    );
  }

  const [myClasses, joinable, taughtWithSchool, groups] = await Promise.all([
    getTeacherClasses(user.id),
    getJoinableClassesForTeacher(user.id),
    getTaughtClassesWithSchool(user.id),
    getClassGroupsForTeacher(user.id),
  ]);

  const bySchool = new Map<string, typeof joinable>();
  for (const c of joinable) {
    bySchool.set(c.school.id, [...(bySchool.get(c.school.id) ?? []), c]);
  }
  const schoolsForGrouping = new Map<string, typeof taughtWithSchool>();
  for (const c of taughtWithSchool) {
    schoolsForGrouping.set(c.schoolId, [...(schoolsForGrouping.get(c.schoolId) ?? []), c]);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Classes</h1>
        <p className="mt-1 text-sm text-subtle">Everything you teach, plus classes you can join in your own school.</p>
      </div>

      <Card>
        <CardHeader className="font-semibold">My classes ({myClasses.length})</CardHeader>
        <CardBody className="p-0">
          {myClasses.length === 0 ? (
            <p className="p-4 text-sm text-subtle">You don't teach any classes yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {myClasses.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span>
                    {c.subject ? `${c.subject} — ` : ""}
                    {c.name}
                  </span>
                  <Link href={`/students/${c.id}`} className="text-xs text-accent hover:underline">
                    Roster
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {[...bySchool.entries()].map(([schoolId, classes]) => (
        <Card key={schoolId}>
          <CardHeader className="font-semibold">Join a class at {classes[0].school.name}</CardHeader>
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {classes.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{c.name}</p>
                    {c.classTeachers.length > 0 && (
                      <p className="text-xs text-subtle">
                        Currently taught by {c.classTeachers.map((t) => `${t.teacher.name} (${t.subject})`).join(", ")}
                      </p>
                    )}
                  </div>
                  <JoinClassForm classId={c.id} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ))}

      {groups.length > 0 && (
        <Card>
          <CardHeader className="font-semibold">Your compound classes</CardHeader>
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {groups.map((g) => (
                <li key={g.id} className="px-4 py-3 text-sm">
                  <p className="font-medium">{g.name}</p>
                  <p className="text-xs text-subtle">{g.members.map((m) => m.class.name).join(", ")}</p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {[...schoolsForGrouping.entries()].map(([schoolId, classes]) => (
        <Card key={schoolId}>
          <CardHeader className="font-semibold">Create a compound class</CardHeader>
          <CardBody>
            <p className="mb-3 text-sm text-subtle">
              Group several of your own classes into one bundle — e.g. every section you teach the same subject to.
            </p>
            <CreateGroupForm schoolId={schoolId} classes={classes} />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
