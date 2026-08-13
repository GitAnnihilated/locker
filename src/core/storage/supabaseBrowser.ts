"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side client used ONLY to call storage.uploadToSignedUrl — the
 * upload itself still requires the signed token from createUploadUrl (see
 * core/storage/actions.ts), so the anon key alone can't upload anything on
 * its own. Safe to expose (NEXT_PUBLIC_*), same as any anon/public key.
 */
let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("File uploads aren't set up yet — missing NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  client = createClient(url, anonKey);
  return client;
}
