"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

/**
 * Browser client that shares the staff session cookie, so Realtime
 * subscriptions run under the signed-in staff member's row-level security.
 */
export function supabaseBrowser(url: string, anonKey: string) {
  client ??= createBrowserClient(url, anonKey);
  return client;
}
