import "server-only";
import { hasSupabase } from "@/lib/env";
import { demoRepo } from "@/lib/db/demo-repo";
import { supabaseRepo } from "@/lib/db/supabase-repo";
import type { Repo } from "@/lib/db/repo";

/** Supabase when configured, otherwise the in-memory demo store. */
export const repo: Repo = hasSupabase ? supabaseRepo : demoRepo;

export { NotFoundError, UnavailableError, ValidationError } from "@/lib/db/repo";
