import Link from "next/link";
import { requireDbUser } from "@/core/auth/session";
import { getRecentNotifications, getUnreadCount } from "@/core/notifications/queries";
import { NotificationBell } from "@/core/notifications/components/NotificationBell";
import { Avatar } from "@/ui/components/Avatar";
import { LogoutButton } from "@/core/auth/components/LogoutButton";
import { LogoMark } from "@/ui/brand/Logo";
import { Sidebar } from "./_components/Sidebar";
import { MobileNav } from "./_components/MobileNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireDbUser returns the fresh DB user (not the JWT snapshot), so
  // name/nickname edits show up without re-login.
  const user = await requireDbUser();
  const [notifications, unreadCount] = await Promise.all([
    getRecentNotifications(user.id),
    getUnreadCount(user.id),
  ]);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:block">
        <Sidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center md:hidden">
            <LogoMark size={22} />
          </Link>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <NotificationBell notifications={notifications} unreadCount={unreadCount} />
            <Link href="/profile" className="flex items-center gap-2">
              <span className="hidden text-sm text-subtle sm:inline">
                {user.nickname || user.name}
              </span>
              <Avatar name={user.name} image={user.image} size={28} />
            </Link>
            <LogoutButton />
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-20 pt-6 sm:px-6 sm:py-8 md:pb-8">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
