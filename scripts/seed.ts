/**
 * Loads the demo menu into Supabase (run supabase/schema.sql first).
 *
 *   npm run seed
 *
 * Seed photos point at /food/*.webp, which ship with the app. Safe to re-run:
 * categories and dishes are upserted by id.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { SEED_CATEGORIES, SEED_ITEMS } from "../lib/demo/seed";
import { itemToRow } from "../lib/db/rows";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { error: catError } = await db.from("categories").upsert(SEED_CATEGORIES.map(({ id, name, blurb, sort }) => ({ id, name, blurb, sort })));
  if (catError) throw catError;
  console.log(`✓ ${SEED_CATEGORIES.length} menu sections`);

  const { error: itemError } = await db.from("menu_items").upsert(SEED_ITEMS.map((item) => itemToRow(item)));
  if (itemError) throw itemError;
  console.log(`✓ ${SEED_ITEMS.length} dishes`);
  console.log("\nNext: create a staff user in Supabase Auth and add them to public.staff (see README).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
