/** Money is stored as integer cents everywhere — format only at the edge. */
export function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/** "in 2 days", "today", "3 days ago" — friendly due dates. */
export function relativeDay(date: Date | string | null): string {
  if (!date) return "No due date";
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  const days = Math.round(
    (startOfDay(d).getTime() - startOfDay(today).getTime()) / 86_400_000,
  );
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days === -1) return "Due yesterday";
  if (days > 1) return `Due in ${days} days`;
  return `${Math.abs(days)} days overdue`;
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** "3 minutes ago", "2 hours ago", "5 days ago" — for activity feeds and requests. */
export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));

  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
