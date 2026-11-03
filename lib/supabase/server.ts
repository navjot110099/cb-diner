import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/** Cookie-bound client: used for staff auth, so the session is the visitor's own. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: the middleware refreshes sessions instead.
        }
      },
    },
  });
}

let admin: SupabaseClient | undefined;

/** Service-role client for menu reads and validated writes. Never expose to the browser. */
export function createAdminClient() {
  admin ??= createSupabaseClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
