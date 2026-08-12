import Link from "next/link";
import { requireDbUser } from "@/core/auth/session";
import { Card, CardBody } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";
import { getTeacherClasses } from "@/modules/ptm/queries";

/** Teacher-only class picker for the Student Notebook — see requireClassTeacher on every page beneath this. */
export default async function StudentsIndexPage() {
  const user = await requireDbUser();
  const classes = await getTeacherClasses(user.id);

  if (classes.length === 0) {
    return (
      <EmptyState
        icon="🧑‍🏫"
        title="No classes yet"
        description="Once you're teaching a class, its roster and student notebook show up here."
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Students</h1>
        <p className="mt-1 text-sm text-subtle">Pick a class to see its roster, follow-ups, and notes.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {classes.map((c) => (
          <Link key={c.id} href={`/students/${c.id}`}>
            <Card className="transition duration ease hover:-translate-y-0.5 hover:shadow-sm">
              <CardBody>
                <p className="font-semibold">{c.name}</p>
                {c.subject && <p className="mt-1 text-sm text-subtle">{c.subject}</p>}
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
