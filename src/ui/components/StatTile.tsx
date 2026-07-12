import Link from "next/link";
import { Card, CardBody } from "@/ui/components/Card";
import { cn } from "@/lib/cn";

const TINTS = {
  accent: "bg-accent-soft text-accent",
  lime: "bg-brand-lime-soft text-brand-lime",
  orange: "bg-brand-orange-soft text-brand-orange",
  neutral: "bg-muted text-subtle",
} as const;

/** A linked stat summary tile — used on the dashboard and profile. */
export function StatTile({
  href,
  label,
  value,
  icon,
  tint = "neutral",
}: {
  href: string;
  label: string;
  value: number | string;
  icon?: string;
  tint?: keyof typeof TINTS;
}) {
  return (
    <Link href={href}>
      <Card className="transition duration ease hover:-translate-y-0.5 hover:shadow-sm">
        <CardBody className="flex items-center gap-3">
          {icon && (
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base", TINTS[tint])}>
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xl font-bold leading-none">{value}</p>
            <p className="mt-1 text-xs text-subtle">{label}</p>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
