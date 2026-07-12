/**
 * Next.js's redirect() throws a special control-flow error to unwind out of
 * a Server Action. When a client component wraps an action's error in a
 * try/catch (e.g. to show a validation message), that redirect error must be
 * rethrown, never swallowed — this helper identifies it.
 */
export function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
