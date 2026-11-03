export const ITEM_TAGS = ["signature", "chef", "new", "seasonal", "gf", "vegan", "shareable"] as const;
export type ItemTag = (typeof ITEM_TAGS)[number];

export type Category = {
  id: string;
  name: string;
  /** One-line intro shown under the section title. */
  blurb: string;
  sort: number;
};

export type ItemImage = {
  /** 4:3 photo (~720px wide) for the dish sheet. */
  full: string;
  /** Square thumbnail (~288px) for menu rows. */
  thumb: string;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  /** Whole US dollars, before tax and gratuity. */
  price: number;
  isVeg: boolean;
  tags: ItemTag[];
  image: ItemImage | null;
  isAvailable: boolean;
  sort: number;
};

export type MenuItemInput = Omit<MenuItem, "id" | "sort"> & { sort?: number };

export const ORDER_STATUSES = ["new", "preparing", "served", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** A snapshot of the dish at order time, so later menu edits never change an order. */
export type OrderLine = {
  itemId: string;
  name: string;
  price: number;
  qty: number;
  isVeg: boolean;
};

export type Order = {
  id: string;
  number: number;
  /** Table number from the QR code, or null for pickup / bar orders. */
  table: string | null;
  customerName: string | null;
  note: string | null;
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type NewOrder = {
  table: string | null;
  customerName: string | null;
  note: string | null;
  lines: { itemId: string; qty: number }[];
};

export type StaffRole = "kitchen" | "admin";

export type StaffUser = {
  id: string;
  name: string;
  email: string | null;
  role: StaffRole;
};
