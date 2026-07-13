"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@/ui/components/Button";
import { LogoMark } from "@/ui/brand/Logo";

/**
 * Root error boundary — catches anything an error.tsx-eligible page throws
 * (everything under the root layout; the root layout itself needs
 * global-error.tsx, which is intentionally not added since we don't want to
 * lose the shared <head>/fonts on every crash).
 *
 * One error deserves special handling: "Server Action ... was not found on
 * the server." Server Action IDs are build-specific hashes. Since this app
 * now deploys frequently, anyone with a tab open across a deploy WILL submit
 * a form and hit this — it's not a bug, it's a stale client bundle. A plain
 * refresh always fixes it, so we detect the message and say exactly that
 * instead of showing Next.js's generic crash dialog.
 */
export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isStaleDeploy = useMemo(
    () => /Server Action .* was not found/i.test(error.message),
    [error.message],
  );

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-2 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
        <LogoMark size={26} tone="mono" className="text-accent-fg" />
      </span>

      {isStaleDeploy ? (
        <>
          <h1 className="text-xl font-bold">A new version of Locker is ready</h1>
          <p className="max-w-sm text-sm text-subtle">
            This page was open from before the last update. Refresh to pick up the latest version — your data is safe.
          </p>
          <Button size="lg" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="max-w-sm text-sm text-subtle">
            That&apos;s on us, not you. Try again — if it keeps happening, refreshing usually clears it.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="lg" onClick={() => window.location.reload()}>
              Refresh
            </Button>
            <Button size="lg" onClick={() => reset()}>
              Try again
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
