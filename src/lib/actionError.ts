import { isRedirectError } from "./isRedirectError";

/**
 * Shared catch-block handler for Server Actions. Next.js redacts thrown
 * Server Action errors down to a generic "omitted in production" message in
 * production builds, so expected/user-facing failures (including ones
 * thrown by guard helpers like core/permissions/guards.ts) must be
 * converted to a normal `{ error }` return value instead of propagating as
 * a throw. redirect()'s special NEXT_REDIRECT-digest error and any
 * non-Error throw (genuinely unexpected) are rethrown untouched.
 *
 * Usage:
 *   try {
 *     ...
 *   } catch (e) {
 *     return handleActionError(e);
 *   }
 */
export function handleActionError(e: unknown): { error: string } {
  if (isRedirectError(e)) throw e; // success — let the redirect propagate
  if (e instanceof Error) return { error: e.message };
  throw e; // genuinely unexpected — let it hit the error boundary
}
