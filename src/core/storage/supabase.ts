import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * File storage on Supabase Storage — a separate quota from the Postgres
 * database (500MB DB limit vs. its own Storage allowance), so uploads
 * never compete with row storage. Chosen over a separate provider (e.g.
 * Cloudflare R2) for now specifically to avoid a second account/vendor
 * while the project is small — revisit if/when the Supabase plan gets
 * upgraded and storage needs grow past the free bucket.
 *
 * Service-role client — bypasses Storage's row-level security, which is
 * fine here because our OWN auth check (requireUser, in actions.ts) is
 * what actually gates who gets a signed upload URL in the first place.
 * Never expose this client or its key to the browser.
 */
const globalForSupabase = globalThis as unknown as { supabaseServiceClient?: SupabaseClient };

export function getSupabaseServiceClient(): SupabaseClient {
  if (globalForSupabase.supabaseServiceClient) return globalForSupabase.supabaseServiceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "File uploads aren't set up yet — an admin needs to add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET (see .env.example).",
    );
  }
  const client = createClient(url, serviceKey, { auth: { persistSession: false } });
  if (process.env.NODE_ENV !== "production") globalForSupabase.supabaseServiceClient = client;
  return client;
}

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "locker-uploads";
