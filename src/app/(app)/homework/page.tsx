import { requireUser } from "@/core/auth/session";
import { getActiveMembership } from "@/core/membership/queries";
import { Card } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";
import { getHomeworkBoard, getCoverage } from "@/modules/homework/queries";
import { HomeworkItem } from "@/modules/homework/components/HomeworkItem";
import { HomeworkForm } from "@/modules/homework/components/HomeworkForm";
import { CoverageMeter } from "@/modules/homework/components/CoverageMeter";
import Link from "next/link";
import { Button } from "@/ui/components/Button";

export default async function HomeworkPage() {
  const user = await requireUser();
  const membership = await getActiveMembership(user.id);

  if (!membership) {
    return (
      <EmptyState
        icon="🚪"
        title="Join a class to see homework"
        description="Homework is shared with your classmates. Join or create a class to get started."
        action={
          <Link href="/onboarding">
            <Button>Join a class</Button>
          </Link>
        }
      />
    );
  }

  const [board, coverage] = await Promise.all([
    getHomeworkBoard(membership.classId, user.id),
    getCoverage(membership.classId),
  ]);

  const canManage = membership.role === "FOUNDER" || membership.role === "MODERATOR";
  const pending = board.filter((h) => !h.done);
  const done = board.filter((h) => h.done);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Homework</h1>
          <p className="text-sm text-subtle">{membership.class.name}</p>
        </div>

        {board.length === 0 ? (
          <EmptyState
            icon="🎉"
            title="Nothing due — for now"
            description="Add the first assignment. Your classmates will thank you."
          />
        ) : (
          <Card>
            {pending.map((item) => (
              <HomeworkItem key={item.id} item={item} canManage={canManage} />
            ))}
            {done.length > 0 && (
              <div className="border-t border-border px-5 py-2 text-xs font-medium uppercase tracking-wide text-subtle">
                Done ({done.length})
              </div>
            )}
            {done.map((item) => (
              <HomeworkItem key={item.id} item={item} canManage={canManage} />
            ))}
          </Card>
        )}
      </div>

      <aside className="space-y-6">
        <Card>
          <div className="border-b border-border px-5 py-4 font-semibold">
            Add assignment
          </div>
          <div className="p-5">
            <HomeworkForm />
          </div>
        </Card>
        <CoverageMeter
          pct={coverage.pct}
          confirmed={coverage.confirmed}
          total={coverage.total}
        />
      </aside>
    </div>
  );
}
