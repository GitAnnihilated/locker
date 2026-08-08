import { requireUser } from "@/core/auth/session";
import { getActiveMembership } from "@/core/membership/queries";
import { getUpcomingEvents } from "@/modules/events/queries";
import { EventCard } from "@/modules/events/components/EventCard";
import { CreateEventForm } from "@/modules/events/components/CreateEventForm";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";

export default async function EventsPage() {
  const user = await requireUser();
  const membership = await getActiveMembership(user.id);
  if (!membership) {
    return <EmptyState icon="🚪" title="Join a course to see campus events" />;
  }

  const events = await getUpcomingEvents(membership.schoolId, user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-sm text-subtle">Workshops, hackathons, and campus happenings.</p>
      </div>

      {events.length === 0 ? (
        <EmptyState icon="📅" title="No upcoming events" description="Post the first one below." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="font-semibold">Post an event</CardHeader>
        <CardBody>
          <CreateEventForm />
        </CardBody>
      </Card>
    </div>
  );
}
