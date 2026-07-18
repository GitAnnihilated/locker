"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { enabledModules } from "@/core/modules/registry";
import { Logo } from "@/ui/brand/Logo";
import { LinkPendingFade } from "@/ui/components/LinkPendingFade";
import { cn } from "@/lib/cn";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      <Link href="/dashboard" className="mb-5 flex items-center px-2 py-1">
        <Logo size={24} />
      </Link>

      {enabledModules().map((m) => {
        const active = pathname.startsWith(m.href);
        return (
          <Link
            key={m.id}
            href={m.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition duration ease",
              active ? "bg-accent-soft text-accent" : "text-subtle hover:bg-muted hover:text-text",
            )}
          >
            <LinkPendingFade className="flex items-center gap-3">
              <span className="text-base">{m.icon}</span>
              {m.name}
            </LinkPendingFade>
          </Link>
        );
      })}
    </nav>
  );
}
