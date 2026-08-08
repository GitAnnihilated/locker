import { requireUser } from "@/core/auth/session";
import { getClubDetail } from "@/modules/clubs/queries";
import { Avatar } from "@/ui/components/Avatar";
import { Badge } from "@/ui/components/Badge";
import { Card, CardBody, CardHeader } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";
import { ClubJoinButton } from "@/modules/clubs/components/ClubJoinButton";

export default async function ClubDetailPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  const user = await requireUser();
  const club = await getClubDetail(clubId, user.id);

  if (!club) {
    return <EmptyState icon="🎭" title="Club not found" />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{club.name}</h1>
          {club.category && <p className="mt-1 text-sm text-subtle">{club.category}</p>}
          {club.description && <p className="mt-2 text-sm">{club.description}</p>}
        </div>
        <ClubJoinButton clubId={club.id} isMember={club.isMember} isFounder={club.founderId === user.id} />
      </div>

      {club.events.length > 0 && (
        <Card>
          <CardHeader className="font-semibold">Upcoming events</CardHeader>
          <CardBody className="space-y-3 p-0">
            {club.events.map((e) => (
              <div key={e.id} className="border-b border-border px-4 py-3 last:border-0">
                <p className="text-sm font-medium">{e.title}</p>
                <p className="text-xs text-subtle">
                  {new Date(e.startAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  {e.location && ` · ${e.location}`}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader className="font-semibold">Members ({club.members.length})</CardHeader>
        <CardBody className="flex flex-wrap gap-3 p-4">
          {club.members.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <Avatar name={m.user.nickname || m.user.name} image={m.user.image} size={28} />
              <div>
                <p className="text-sm font-medium">{m.user.nickname || m.user.name}</p>
                {m.role === "ORGANIZER" && <Badge tone="accent">Organizer</Badge>}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
