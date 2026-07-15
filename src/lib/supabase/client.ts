"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Only the anon (public) key + project URL — safe to expose to the browser.
// This client is used exclusively for Realtime subscriptions; all actual
// data reads/writes still go through Prisma via Server Actions, which stay
// the only security boundary that matters (Realtime here is a notification
// channel, not a data-access path).
let client: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set — realtime chat can't connect.",
    );
  }

  client = createClient(url, anonKey, {
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return client;
}
