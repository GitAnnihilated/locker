import type { Metadata } from "next";
import Link from "next/link";
import { requireDbUser } from "@/core/auth/session";
import { getRecentNotifications, getUnreadCount } from "@/core/notifications/queries";
import { NotificationBell } from "@/core/notifications/components/NotificationBell";
import { recordDailyActivity } from "@/core/rewards/engine";
import { getEquippedCosmetics } from "@/core/rewards/queries";
import { CelebrationQueue } from "@/modules/rewards/components/CelebrationQueue";
import { Avatar } from "@/ui/components/Avatar";
import { CosmeticName } from "@/ui/components/CosmeticName";
import { LogoutButton } from "@/core/auth/components/LogoutButton";
import { LogoMark } from "@/ui/brand/Logo";
import { Sidebar } from "./_components/Sidebar";
import { MobileNav } from "./_components/MobileNav";

// Every route in this group requires a signed-in DB user (requireDbUser
// below redirects otherwise), so none of it should ever be indexed —
// noindex here covers the whole group in one place rather than per-page.
// robots.txt disallows these paths too; this is the defense-in-depth
// layer for a crawler that ignores robots.txt but still renders the page
// (which, since it just gets redirected to /login, would index nothing
// useful anyway — this just makes the "don't index it" explicit).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireDbUser returns the fresh DB user (not the JWT snapshot), so
  // name/nickname edits show up without re-login.
  const user = await requireDbUser();
  const isStudent = user.role === "STUDENT";

  // Gamification (streaks/points/badges) is a student-motivation layer —
  // recordDailyActivity is skipped entirely for teachers/principals rather
  // than run-and-hide, so it's neither wasted writes nor a dead feature
  // silently tracking staff accounts. Notifications/cosmetics stay for
  // everyone; those aren't reward-system concepts.
  const [, notifications, unreadCount, cosmetics] = await Promise.all([
    isStudent ? recordDailyActivity(user.id) : Promise.resolve(),
    getRecentNotifications(user.id),
    getUnreadCount(user.id),
    getEquippedCosmetics(user.id),
  ]);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:block">
        <Sidebar educationType={user.educationType} role={user.role} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center md:hidden">
            <LogoMark size={22} />
          </Link>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <NotificationBell notifications={notifications} unreadCount={unreadCount} />
            <Link href="/profile" className="flex items-center gap-2">
              <CosmeticName color={cosmetics.nameColor} className="hidden text-sm text-subtle sm:inline">
                {user.nickname || user.name}
              </CosmeticName>
              <Avatar name={user.nickname || user.name} image={user.image} size={28} frame={cosmetics.avatarFrame} />
            </Link>
            <LogoutButton />
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-20 pt-6 sm:px-6 sm:py-8 md:pb-8">
          {children}
        </main>
      </div>

      <MobileNav educationType={user.educationType} role={user.role} />
      {isStudent && <CelebrationQueue />}
    </div>
  );
}
