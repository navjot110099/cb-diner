import "server-only";
import { now } from "@/lib/clock";
import { SEED_CATEGORIES, SEED_ITEMS } from "@/lib/demo/seed";
import { NotFoundError, priceOrder, slugify, type Repo } from "@/lib/db/repo";
import type { Category, MenuItem, Order, OrderStatus } from "@/lib/types";

/**
 * In-memory store for demo mode. Lives on globalThis so dev hot reloads keep
 * it; on serverless each instance has its own copy, which resets on cold start.
 */
type Store = { version: number; categories: Category[]; items: MenuItem[]; orders: Order[]; nextNumber: number };

/** Bump when the seed changes shape, so a running dev server reseeds instead of serving stale data. */
const STORE_VERSION = 2;

const g = globalThis as typeof globalThis & { __cbDinerStore?: Store };

function seedOrders(now: number): Order[] {
  const item = (id: string) => SEED_ITEMS.find((i) => i.id === id)!;
  const recipes: { ago: number; table: string | null; status: OrderStatus; lines: [string, number][]; name?: string; note?: string }[] = [
    { ago: 2, table: "7", status: "new", lines: [["filet-mignon", 1], ["bone-in-ribeye", 1], ["truffle-parmesan-fries", 1], ["napa-cabernet", 2]], note: "Filet medium-rare, ribeye medium" },
    { ago: 4, table: null, status: "new", lines: [["oysters-half-dozen", 2], ["champagne-glass", 2]], name: "Madison" },
    { ago: 11, table: "3", status: "preparing", lines: [["maine-lobster", 1], ["lobster-mac", 1], ["burrata-heirloom", 1]] },
    { ago: 24, table: "12", status: "preparing", lines: [["tomahawk-for-two", 1], ["whipped-potatoes", 1], ["crispy-brussels", 1], ["cb-old-fashioned", 2]], note: "Celebrating an anniversary" },
    { ago: 34, table: "5", status: "served", lines: [["classic-caesar", 2], ["chilean-sea-bass", 1], ["classic-martini", 2]] },
    { ago: 52, table: "9", status: "served", lines: [["grand-seafood-tower", 1], ["champagne-glass", 3]] },
    { ago: 75, table: "1", status: "served", lines: [["cb-wagyu-burger", 2], ["new-york-cheesecake", 2]] },
    { ago: 96, table: "14", status: "served", lines: [["braised-short-rib", 1], ["colorado-rack-of-lamb", 1], ["molten-chocolate-cake", 1]] },
    { ago: 128, table: null, status: "served", lines: [["espresso-martini", 2], ["creme-brulee", 1]], name: "Ethan" },
    { ago: 150, table: "6", status: "cancelled", lines: [["a5-wagyu", 1]] },
  ];
  return recipes.map((r, i) => {
    const created = new Date(now - r.ago * 60_000).toISOString();
    const lines = r.lines.map(([id, qty]) => {
      const it = item(id);
      return { itemId: id, name: it.name, price: it.price, qty, isVeg: it.isVeg };
    });
    const updated = r.status === "new" ? created : new Date(now - Math.max(0, r.ago - 6) * 60_000).toISOString();
    return {
      id: `demo-${1050 - i}-${(now + i).toString(36)}`,
      number: 1050 - i,
      table: r.table,
      customerName: r.name ?? null,
      note: r.note ?? null,
      lines,
      total: lines.reduce((s, l) => s + l.price * l.qty, 0),
      status: r.status,
      createdAt: created,
      updatedAt: updated,
    };
  });
}

/** Demo only: put the seed data back. */
export function resetDemoStore() {
  g.__cbDinerStore = undefined;
}

function store(): Store {
  if (g.__cbDinerStore?.version !== STORE_VERSION) {
    g.__cbDinerStore = {
      version: STORE_VERSION,
      categories: structuredClone(SEED_CATEGORIES),
      items: structuredClone(SEED_ITEMS),
      orders: seedOrders(now()),
      nextNumber: 1051,
    };
  }
  return g.__cbDinerStore;
}

const clone = <T,>(v: T): T => structuredClone(v);

export const demoRepo: Repo = {
  async listCategories() {
    return clone([...store().categories].sort((a, b) => a.sort - b.sort));
  },

  async listItems() {
    return clone([...store().items].sort((a, b) => a.sort - b.sort));
  },

  async getItem(id) {
    const found = store().items.find((i) => i.id === id);
    return found ? clone(found) : null;
  },

  async createItem(input) {
    const s = store();
    let id = slugify(input.name) || "dish";
    while (s.items.some((i) => i.id === id)) id = `${slugify(input.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const item: MenuItem = { ...input, id, sort: input.sort ?? Math.max(0, ...s.items.map((i) => i.sort)) + 1 };
    s.items.push(item);
    return clone(item);
  },

  async updateItem(id, input) {
    const s = store();
    const index = s.items.findIndex((i) => i.id === id);
    if (index < 0) throw new NotFoundError("Dish not found");
    s.items[index] = { ...s.items[index], ...input, id, sort: input.sort ?? s.items[index].sort };
    return clone(s.items[index]);
  },

  async setAvailability(id, isAvailable) {
    const item = store().items.find((i) => i.id === id);
    if (!item) throw new NotFoundError("Dish not found");
    item.isAvailable = isAvailable;
  },

  async deleteItem(id) {
    const s = store();
    s.items = s.items.filter((i) => i.id !== id);
  },

  async uploadPhoto(_key, full, thumb, type) {
    // Demo mode keeps uploads in memory as data URLs (the client already resized them).
    const toUrl = (bytes: Uint8Array) => `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
    return { full: toUrl(full), thumb: toUrl(thumb) };
  },

  async createOrder(input) {
    const s = store();
    const { lines, total } = priceOrder(s.items, input.lines);
    const createdAt = new Date(now()).toISOString();
    const order: Order = {
      id: crypto.randomUUID(),
      number: s.nextNumber++,
      table: input.table,
      customerName: input.customerName,
      note: input.note,
      lines,
      total,
      status: "new",
      createdAt,
      updatedAt: createdAt,
    };
    s.orders.unshift(order);
    if (s.orders.length > 500) s.orders.length = 500;
    return clone(order);
  },

  async getOrder(id) {
    const found = store().orders.find((o) => o.id === id);
    return found ? clone(found) : null;
  },

  async listOrders(since) {
    const t = since.getTime();
    return clone(
      store()
        .orders.filter((o) => new Date(o.createdAt).getTime() >= t)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  },

  async updateOrderStatus(id, status) {
    const order = store().orders.find((o) => o.id === id);
    if (!order) throw new NotFoundError("Order not found");
    order.status = status;
    order.updatedAt = new Date(now()).toISOString();
    return clone(order);
  },
};
