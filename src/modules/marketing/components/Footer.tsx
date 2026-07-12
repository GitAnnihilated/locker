import Link from "next/link";
import { Logo } from "@/ui/brand/Logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "For schools", href: "#schools" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/signup" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col justify-between gap-10 sm:flex-row">
          <div className="max-w-xs">
            <Logo size={24} />
            <p className="mt-3 text-sm text-subtle">
              The daily tool built for students — homework, marketplace,
              projects, and real achievements in one place.
            </p>
          </div>

          <div className="flex gap-16">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-faint">
                  {col.title}
                </p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-subtle transition duration ease hover:text-text"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Locker. Built for students.</p>
        </div>
      </div>
    </footer>
  );
}
