"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/rewards", label: "Progress" },
  { href: "/rewards/badges", label: "Badges" },
  { href: "/rewards/store", label: "Store" },
  { href: "/rewards/leaderboard", label: "Leaderboard" },
];

export function RewardsTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-border">
      {TABS.map((t) => {
        const active = t.href === "/rewards" ? pathname === "/rewards" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "border-b-2 px-3 py-2.5 text-sm font-medium transition duration ease",
              active ? "border-accent text-accent" : "border-transparent text-subtle hover:text-text",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
