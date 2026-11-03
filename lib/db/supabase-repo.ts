import "server-only";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";
import { NotFoundError, priceOrder, slugify, type Repo } from "@/lib/db/repo";
import { itemToRow, rowToCategory, rowToItem, rowToOrder, type CategoryRow, type MenuItemRow, type OrderRow } from "@/lib/db/rows";

/**
 * Supabase implementation. All calls use the service-role client on the
 * server; callers check staff permissions first (see lib/auth.ts). The
 * browser only talks to Supabase for the kitchen's Realtime feed, which is
 * guarded by row-level security (supabase/schema.sql).
 */
const db = () => createAdminClient();

function fail(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message);
}

export const supabaseRepo: Repo = {
  async listCategories() {
    const { data, error } = await db().from("categories").select("*").order("sort");
    fail(error);
    return (data as CategoryRow[]).map(rowToCategory);
  },

  async listItems() {
    const { data, error } = await db().from("menu_items").select("*").order("sort");
    fail(error);
    return (data as MenuItemRow[]).map(rowToItem);
  },

  async getItem(id) {
    const { data, error } = await db().from("menu_items").select("*").eq("id", id).maybeSingle();
    fail(error);
    return data ? rowToItem(data as MenuItemRow) : null;
  },

  async createItem(input) {
    const { data: last } = await db().from("menu_items").select("sort").order("sort", { ascending: false }).limit(1).maybeSingle();
    const id = `${slugify(input.name) || "dish"}-${Math.random().toString(36).slice(2, 6)}`;
    const row = itemToRow({ ...input, id, sort: input.sort ?? (last?.sort ?? 0) + 1 });
    const { data, error } = await db().from("menu_items").insert(row).select("*").single();
    fail(error);
    return rowToItem(data as MenuItemRow);
  },

  async updateItem(id, input) {
    const current = await this.getItem(id);
    if (!current) throw new NotFoundError("Dish not found");
    const row = itemToRow({ ...input, sort: input.sort ?? current.sort });
    const { data, error } = await db().from("menu_items").update(row).eq("id", id).select("*").single();
    fail(error);
    return rowToItem(data as MenuItemRow);
  },

  async setAvailability(id, isAvailable) {
    const { error, count } = await db().from("menu_items").update({ is_available: isAvailable }, { count: "exact" }).eq("id", id);
    fail(error);
    if (!count) throw new NotFoundError("Dish not found");
  },

  async deleteItem(id) {
    const { error } = await db().from("menu_items").delete().eq("id", id);
    fail(error);
  },

  async uploadPhoto(itemKey, full, thumb, type) {
    const bucket = db().storage.from(env.storageBucket);
    const base = `${slugify(itemKey) || "dish"}/${Date.now().toString(36)}`;
    const ext = type === "image/webp" ? "webp" : "jpg";
    const upload = async (name: string, bytes: Uint8Array) => {
      const path = `${base}-${name}.${ext}`;
      const { error } = await bucket.upload(path, bytes, { contentType: type, cacheControl: "31536000", upsert: false });
      fail(error);
      return bucket.getPublicUrl(path).data.publicUrl;
    };
    return { full: await upload("full", full), thumb: await upload("thumb", thumb) };
  },

  async createOrder(input) {
    const menu = await this.listItems();
    const { lines, total } = priceOrder(menu, input.lines);
    const { data, error } = await db()
      .from("orders")
      .insert({ table_no: input.table, customer_name: input.customerName, note: input.note, lines, total, status: "new" })
      .select("*")
      .single();
    fail(error);
    return rowToOrder(data as OrderRow);
  },

  async getOrder(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const { data, error } = await db().from("orders").select("*").eq("id", id).maybeSingle();
    fail(error);
    return data ? rowToOrder(data as OrderRow) : null;
  },

  async listOrders(since) {
    const { data, error } = await db()
      .from("orders")
      .select("*")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(300);
    fail(error);
    return (data as OrderRow[]).map(rowToOrder);
  },

  async updateOrderStatus(id, status) {
    const { data, error } = await db().from("orders").update({ status }).eq("id", id).select("*").maybeSingle();
    fail(error);
    if (!data) throw new NotFoundError("Order not found");
    return rowToOrder(data as OrderRow);
  },
};
