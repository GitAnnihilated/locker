import Link from "next/link";
import { requireUser } from "@/core/auth/session";
import { getMyResources } from "@/modules/notes/queries";
import { ClassResourceItem } from "@/modules/notes/components/ClassResourceItem";
import { Card, CardBody } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";

export default async function NotesPage() {
  const user = await requireUser();
  const resources = await getMyResources(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Notes & Resources</h1>

      {resources.length === 0 ? (
        <EmptyState icon="📝" title="Nothing shared yet" description="Notes and study guides from your courses show up here." />
      ) : (
        <Card>
          <CardBody className="p-0">
            {resources.map((r) => (
              <ClassResourceItem key={r.id} resource={r} viewerId={user.id} showCourse />
            ))}
          </CardBody>
        </Card>
      )}

      <Link href="/courses" className="block text-center text-sm font-medium text-accent hover:underline">
        Share a resource from a specific course →
      </Link>
    </div>
  );
}
