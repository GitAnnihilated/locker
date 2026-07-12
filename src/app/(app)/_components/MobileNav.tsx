"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { enabledModules } from "@/core/modules/registry";
import { cn } from "@/lib/cn";

/**
 * The sidebar is hidden below `md` — without this, phones would have no way
 * to reach Homework/Marketplace/Groups/etc. A bottom tab bar is the
 * thumb-reachable standard for a daily-use mobile app.
 */
export function MobileNav() {
  const pathname = usePathname();
  const modules = enabledModules();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-none md:hidden"
      aria-label="Primary"
    >
      {modules.map((m) => {
        const active = pathname.startsWith(m.href);
        return (
          <Link
            key={m.id}
            href={m.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition duration ease",
              active ? "text-accent" : "text-faint",
            )}
          >
            <span className="text-lg leading-none">{m.icon}</span>
            {m.name.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}
