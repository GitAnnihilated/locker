import { requireUser } from "@/core/auth/session";
import { getActiveMembership } from "@/core/membership/queries";
import { getSchoolClubs } from "@/modules/clubs/queries";
import { ClubCard } from "@/modules/clubs/components/ClubCard";
import { CreateClubForm } from "@/modules/clubs/components/CreateClubForm";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";

export default async function ClubsPage() {
  const user = await requireUser();
  const membership = await getActiveMembership(user.id);
  if (!membership) {
    return <EmptyState icon="🚪" title="Join a course to discover clubs" />;
  }

  const clubs = await getSchoolClubs(membership.schoolId, user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clubs</h1>
        <p className="text-sm text-subtle">Discover and join clubs on campus.</p>
      </div>

      {clubs.length === 0 ? (
        <EmptyState icon="🎭" title="No clubs yet" description="Start the first one below." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {clubs.map((c) => (
            <ClubCard key={c.id} club={c} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="font-semibold">Start a club</CardHeader>
        <CardBody>
          <CreateClubForm />
        </CardBody>
      </Card>
    </div>
  );
}
