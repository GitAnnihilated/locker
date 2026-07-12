import { EmptyState } from "@/ui/components/EmptyState";
import { relativeTime } from "@/lib/format";
import type { getGroupActivity } from "../queries";

export function ActivityFeed({
  activities,
}: {
  activities: Awaited<ReturnType<typeof getGroupActivity>>;
}) {
  if (activities.length === 0) {
    return <EmptyState icon="📋" title="No activity yet" />;
  }

  return (
    <div>
      {activities.map((a) => (
        <div key={a.id} className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-0">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <div className="min-w-0 flex-1">
            <p className="text-sm">{a.message}</p>
            <p className="text-xs text-subtle">{relativeTime(a.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
