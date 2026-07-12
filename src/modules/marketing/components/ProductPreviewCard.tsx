import { Card, CardBody } from "@/ui/components/Card";
import { Badge } from "@/ui/components/Badge";
import { ProgressBar } from "@/ui/components/ProgressBar";
import { LogoMark } from "@/ui/brand/Logo";

/**
 * An honest product preview: built from Locker's actual Card/Badge/
 * ProgressBar primitives at real scale, not a screenshot or a fabricated
 * mockup image. What you see here is what the product looks like.
 */
export function ProductPreviewCard({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardBody className="space-y-5 p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <LogoMark size={17} tone="mono" className="text-accent-fg" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">Grade 10-B</p>
              <p className="mt-1 text-2xs text-faint">12 classmates</p>
            </div>
          </div>
          <Badge tone="lime">🔥 6-day streak</Badge>
        </div>

        <div className="space-y-2.5 rounded-lg border border-border bg-muted/60 p-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-success bg-success text-[10px] text-white">
              ✓
            </span>
            <span className="flex-1 text-sm text-faint line-through">Chemistry — Chapter 4 problems</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="h-5 w-5 shrink-0 rounded-md border-2 border-border-strong" />
            <span className="flex-1 text-sm">History — Essay draft</span>
            <Badge tone="warning">Due tomorrow</Badge>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="h-5 w-5 shrink-0 rounded-md border-2 border-border-strong" />
            <span className="flex-1 text-sm">Biology — Lab report</span>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium">Science Fair Project</span>
            <span className="text-faint">3 of 4 tasks</span>
          </div>
          <ProgressBar pct={75} />
        </div>
      </CardBody>
    </Card>
  );
}
