import { Card, CardBody } from "@/ui/components/Card";

/**
 * The coverage meter is a growth device: it makes the value of *more
 * classmates* visible. Low coverage nudges the user to invite people who
 * would confirm and fill gaps.
 */
export function CoverageMeter({
  pct,
  confirmed,
  total,
}: {
  pct: number;
  confirmed: number;
  total: number;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Class coverage</p>
          <p className="text-sm font-semibold text-accent">{pct}%</p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-subtle">
          {confirmed} of {total} assignments confirmed by 2+ classmates.{" "}
          {pct < 100 && "Invite more classmates to fill the gaps."}
        </p>
      </CardBody>
    </Card>
  );
}
