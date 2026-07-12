import Link from "next/link";
import { Logo } from "@/ui/brand/Logo";
import { Button } from "@/ui/components/Button";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="Locker home">
          <Logo size={26} />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-subtle md:flex">
          <a href="#features" className="transition duration ease hover:text-text">
            Features
          </a>
          <a href="#how-it-works" className="transition duration ease hover:text-text">
            How it works
          </a>
          <a href="#schools" className="transition duration ease hover:text-text">
            For schools
          </a>
          <a href="#faq" className="transition duration ease hover:text-text">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
