"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { markNotificationRead, markAllNotificationsRead } from "../actions";
import type { Notification } from "@prisma/client";

/**
 * DB-backed, polled on navigation (no websockets/push) — consistent with the
 * rest of the app's server-rendered style. Good enough for "you have a
 * deletion vote to weigh in on"; real-time can replace this later without
 * touching the Notification table shape.
 */
export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-muted"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-border bg-surface shadow-soft">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <button
                  disabled={pending}
                  onClick={() => start(() => markAllNotificationsRead())}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-subtle">
                  Nothing yet.
                </p>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? "#"}
                    onClick={() => {
                      setOpen(false);
                      if (!n.read) start(() => markNotificationRead(n.id));
                    }}
                    className={cn(
                      "block border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-muted",
                      !n.read && "bg-accent/5",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                      <div className="min-w-0 flex-1">
                        <p className={cn(n.read ? "text-subtle" : "font-medium")}>{n.message}</p>
                        <p className="mt-0.5 text-xs text-subtle">
                          {new Date(n.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
