/**
 * Carries the plaintext password from the signup form to the verify-email
 * form, entirely client-side, so verifyEmail() can auto-sign-in without the
 * server ever persisting a plaintext password anywhere (not even briefly —
 * PendingRegistration only ever stores the hash). sessionStorage over
 * localStorage: gone the moment the tab closes, never synced anywhere.
 * If it's missing (different device, cleared storage), verifyEmail() falls
 * back to "verified — please sign in" instead of failing.
 */
const KEY = "locker:pendingPassword";

export function stashPendingPassword(email: string, password: string) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ email, password }));
  } catch {
    // sessionStorage unavailable (private mode, etc.) — verify-email will just skip auto-sign-in
  }
}

export function takePendingPassword(email: string): string | undefined {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { email: string; password: string };
    sessionStorage.removeItem(KEY);
    return parsed.email.toLowerCase() === email.toLowerCase() ? parsed.password : undefined;
  } catch {
    return undefined;
  }
}
