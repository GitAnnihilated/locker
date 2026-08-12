import Link from "next/link";
import { requireDbUser } from "@/core/auth/session";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { getTeacherClasses, getSlotsForClass, getBookableClasses, getUpcomingSlotsForClass } from "@/modules/ptm/queries";
import { CreateSlotsForm } from "@/modules/ptm/components/CreateSlotsForm";
import { TeacherSlotList } from "@/modules/ptm/components/TeacherSlotList";
import { BookingGrid } from "@/modules/ptm/components/BookingGrid";

/**
 * Role-aware, not a giant calendar app: a TEACHER/PRINCIPAL who owns classes
 * gets a slot-management board per class; everyone else gets a booking
 * board across the classes they're a member of. Which branch renders is
 * decided from the caller's own DB rows (teacherId ownership), never a
 * client-supplied flag — a student can never see the manage UI just by
 * knowing this route exists.
 */
export default async function PTMPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const user = await requireDbUser();
  const { class: classId } = await searchParams;

  const teacherClasses = await getTeacherClasses(user.id);
  const isTeacherHere = teacherClasses.length > 0;

  if (isTeacherHere) {
    const activeClassId = classId && teacherClasses.some((c) => c.id === classId) ? classId : teacherClasses[0].id;
    const activeClass = teacherClasses.find((c) => c.id === activeClassId)!;
    const slots = await getSlotsForClass(activeClassId);

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Parent-Teacher Meetings</h1>
          <p className="mt-1 text-sm text-subtle">Open timeslots for your classes — students book what's free.</p>
        </div>

        {teacherClasses.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {teacherClasses.map((c) => (
              <Link
                key={c.id}
                href={`/ptm?class=${c.id}`}
                className={`rounded-full border px-3 py-1 text-sm ${
                  c.id === activeClassId ? "border-accent bg-accent/10 text-accent" : "border-border text-subtle"
                }`}
              >
                {c.subject ? `${c.subject} — ${c.name}` : c.name}
              </Link>
            ))}
          </div>
        )}

        <Card>
          <CardHeader className="font-semibold">
            Open new slots — {activeClass.subject ? `${activeClass.subject} — ` : ""}
            {activeClass.name}
          </CardHeader>
          <CardBody>
            <CreateSlotsForm classId={activeClassId} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="font-semibold">All slots</CardHeader>
          <CardBody>
            <TeacherSlotList slots={slots} />
          </CardBody>
        </Card>
      </div>
    );
  }

  const bookableClasses = await getBookableClasses(user.id);
  const activeClassId = classId && bookableClasses.some((c) => c.id === classId) ? classId : bookableClasses[0]?.id;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Parent-Teacher Meetings</h1>
        <p className="mt-1 text-sm text-subtle">Book an open slot with your teacher.</p>
      </div>

      {bookableClasses.length === 0 ? (
        <Card>
          <CardBody className="text-sm text-subtle">No PTM slots open right now — check back later.</CardBody>
        </Card>
      ) : (
        <>
          {bookableClasses.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {bookableClasses.map((c) => (
                <Link
                  key={c.id}
                  href={`/ptm?class=${c.id}`}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    c.id === activeClassId ? "border-accent bg-accent/10 text-accent" : "border-border text-subtle"
                  }`}
                >
                  {c.subject ? `${c.subject} — ${c.name}` : c.name}
                </Link>
              ))}
            </div>
          )}
          {activeClassId && (
            <Card>
              <CardHeader className="font-semibold">Available slots</CardHeader>
              <CardBody>
                <BookingGrid slots={await getUpcomingSlotsForClass(activeClassId)} currentUserId={user.id} />
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
