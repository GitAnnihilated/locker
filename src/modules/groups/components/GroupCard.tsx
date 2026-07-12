import Link from "next/link";
import { Card, CardBody } from "@/ui/components/Card";
import { Badge } from "@/ui/components/Badge";
import { Avatar } from "@/ui/components/Avatar";
import { relativeDay } from "@/lib/format";
import { STATUS_META } from "../meta";
import type { ClassGroup } from "../queries";

export function GroupCard({ group }: { group: ClassGroup }) {
  const status = STATUS_META[group.status];
  const overdue = group.dueAt && new Date(group.dueAt) < new Date() && group.status !== "COMPLETED";

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="transition hover:border-accent/40">
        <CardBody>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{group.name}</p>
              {group.subject && <p className="text-xs text-subtle">{group.subject}</p>}
            </div>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>

          {group.description && (
            <p className="mt-2 line-clamp-2 text-sm text-subtle">{group.description}</p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex -space-x-2">
              {group.members.slice(0, 5).map((m) => (
                <Avatar
                  key={m.id}
                  name={m.user.nickname || m.user.name}
                  image={m.user.image}
                  size={24}
                  className="ring-2 ring-surface"
                />
              ))}
            </div>
            {group.dueAt && (
              <span className={overdue ? "text-xs font-medium text-danger" : "text-xs text-subtle"}>
                {relativeDay(group.dueAt)}
              </span>
            )}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
