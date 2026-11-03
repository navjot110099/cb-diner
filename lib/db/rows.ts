import type { Category, ItemTag, MenuItem, Order, OrderLine, OrderStatus } from "@/lib/types";

/**
 * Supabase row shapes and mappers. Kept free of server-only imports because
 * the kitchen screen maps Realtime payloads in the browser with `rowToOrder`.
 */
export type CategoryRow = { id: string; name: string; blurb: string; sort: number };

export type MenuItemRow = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  is_veg: boolean;
  tags: string[] | null;
  image_url: string | null;
  thumb_url: string | null;
  is_available: boolean;
  sort: number;
};

export type OrderRow = {
  id: string;
  number: number;
  table_no: string | null;
  customer_name: string | null;
  note: string | null;
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
};

export const rowToCategory = (r: CategoryRow): Category => ({ id: r.id, name: r.name, blurb: r.blurb ?? "", sort: r.sort });

export const rowToItem = (r: MenuItemRow): MenuItem => ({
  id: r.id,
  categoryId: r.category_id,
  name: r.name,
  description: r.description,
  price: r.price,
  isVeg: r.is_veg,
  tags: (r.tags ?? []) as ItemTag[],
  image: r.image_url ? { full: r.image_url, thumb: r.thumb_url || r.image_url } : null,
  isAvailable: r.is_available,
  sort: r.sort,
});

export const itemToRow = (i: Omit<MenuItem, "id"> & { id?: string }): Omit<MenuItemRow, "id"> & { id?: string } => ({
  ...(i.id ? { id: i.id } : {}),
  category_id: i.categoryId,
  name: i.name,
  description: i.description,
  price: i.price,
  is_veg: i.isVeg,
  tags: i.tags,
  image_url: i.image?.full ?? null,
  thumb_url: i.image?.thumb ?? null,
  is_available: i.isAvailable,
  sort: i.sort,
});

export const rowToOrder = (r: OrderRow): Order => ({
  id: r.id,
  number: Number(r.number),
  table: r.table_no,
  customerName: r.customer_name,
  note: r.note,
  lines: r.lines ?? [],
  total: r.total,
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
