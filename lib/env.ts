import "server-only";

/**
 * Server-side configuration.
 *
 * CB Diner runs in two modes:
 * - **Live**: menu, orders and staff accounts live in Supabase (Postgres,
 *   Auth, Storage and Realtime), configured through `.env.local`.
 * - **Demo**: when the Supabase keys are missing, an in-memory store seeded
 *   with the demo menu and a few of today's orders stands in, so every screen
 *   works without accounts. The kitchen screen polls instead of using
 *   Realtime, and staff sign in with one tap.
 */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "menu-photos",
};

export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey);

/** True when the app runs on the in-memory demo store. */
export const isDemoMode = !hasSupabase;
