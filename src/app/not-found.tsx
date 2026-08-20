import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/ui/brand/Logo";
import { Button } from "@/ui/components/Button";

// A 404 should itself be noindex — otherwise Google can end up indexing
// an empty error page for every broken/guessed URL that reaches it.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <LogoMark size={36} />
      <div>
        <h1 className="text-3xl font-bold text-balance sm:text-4xl">Page not found</h1>
        <p className="mt-3 max-w-sm text-subtle">
          That page doesn&apos;t exist, or it moved. Let&apos;s get you back somewhere useful.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/">
          <Button size="lg">Go to homepage</Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="secondary">
            Sign in
          </Button>
        </Link>
      </div>
    </main>
  );
}
