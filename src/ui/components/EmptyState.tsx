import type { ReactNode } from "react";

export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="animate-fade-up flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-subtle">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
