import type { Category, MenuItem, MenuItemInput, NewOrder, Order, OrderStatus } from "@/lib/types";

/** Storage-agnostic data access. Implemented by the demo store and by Supabase. */
export interface Repo {
  listCategories(): Promise<Category[]>;
  listItems(): Promise<MenuItem[]>;
  getItem(id: string): Promise<MenuItem | null>;
  createItem(input: MenuItemInput): Promise<MenuItem>;
  updateItem(id: string, input: MenuItemInput): Promise<MenuItem>;
  setAvailability(id: string, isAvailable: boolean): Promise<void>;
  deleteItem(id: string): Promise<void>;
  /** Stores a resized photo pair (WebP, or JPEG from browsers without WebP encoding) and returns public URLs. */
  uploadPhoto(itemKey: string, full: Uint8Array, thumb: Uint8Array, type: PhotoType): Promise<{ full: string; thumb: string }>;

  /** Prices and names come from the menu here, never from the client. */
  createOrder(input: NewOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | null>;
  /** Orders created at or after `since`, newest first. */
  listOrders(since: Date): Promise<Order[]>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order>;
}

export type PhotoType = "image/webp" | "image/jpeg";

export class NotFoundError extends Error {}

export class ValidationError extends Error {}

/** Thrown when an order contains dishes that are sold out or no longer on the menu. */
export class UnavailableError extends Error {
  constructor(public itemIds: string[]) {
    super("Some dishes are unavailable");
  }
}

/** Snapshots names and prices from the menu and merges duplicate lines. */
export function priceOrder(menu: MenuItem[], lines: NewOrder["lines"]) {
  const byId = new Map(menu.map((i) => [i.id, i]));
  const merged = new Map<string, number>();
  for (const l of lines) merged.set(l.itemId, Math.min(20, (merged.get(l.itemId) ?? 0) + l.qty));

  const unavailable = [...merged.keys()].filter((id) => !byId.get(id)?.isAvailable);
  if (unavailable.length) throw new UnavailableError(unavailable);

  const priced = [...merged].map(([itemId, qty]) => {
    const item = byId.get(itemId)!;
    return { itemId, name: item.name, price: item.price, qty, isVeg: item.isVeg };
  });
  return { lines: priced, total: priced.reduce((sum, l) => sum + l.price * l.qty, 0) };
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 48);
}
