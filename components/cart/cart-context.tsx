"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { isValidTable } from "@/lib/restaurant";
import type { MenuItem } from "@/lib/types";

type CartState = { qty: Record<string, number>; note: string; name: string; table: string | null };

type Action =
  | { type: "hydrate"; state: Partial<CartState> }
  | { type: "set"; id: string; qty: number }
  | { type: "field"; field: "note" | "name"; value: string }
  | { type: "table"; table: string | null }
  | { type: "remove"; ids: string[] }
  | { type: "clear" };

const STORAGE_KEY = "cb-cart-v1";
const TABLE_KEY = "cb-table";
const empty: CartState = { qty: {}, note: "", name: "", table: null };

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.state };
    case "set": {
      const qty = { ...state.qty };
      if (action.qty <= 0) delete qty[action.id];
      else qty[action.id] = Math.min(20, action.qty);
      return { ...state, qty };
    }
    case "field":
      return { ...state, [action.field]: action.value };
    case "table":
      return { ...state, table: action.table };
    case "remove": {
      const qty = { ...state.qty };
      for (const id of action.ids) delete qty[id];
      return { ...state, qty };
    }
    case "clear":
      return { ...empty, name: state.name, table: state.table };
  }
}

export type CartLine = { item: MenuItem; qty: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  total: number;
  note: string;
  name: string;
  table: string | null;
  qtyOf: (id: string) => number;
  setQty: (id: string, qty: number) => void;
  add: (id: string) => void;
  setNote: (v: string) => void;
  setName: (v: string) => void;
  setTable: (v: string | null) => void;
  removeItems: (ids: string[]) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/**
 * The cart lives in localStorage so a refresh, a weak signal or a quick
 * switch to WhatsApp never loses the order. Prices always come from the
 * current menu, so admin price changes apply immediately.
 */
export function CartProvider({ items, initialTable, children }: { items: MenuItem[]; initialTable: string | null; children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { ...empty, table: initialTable });
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as Partial<CartState> | null;
      // The table comes from this visit's QR code (the URL wins over a cached page), never from an old visit.
      const fromUrl = new URLSearchParams(location.search).get("table");
      const fromSession = sessionStorage.getItem(TABLE_KEY);
      const table = isValidTable(fromUrl) ? fromUrl : (initialTable ?? (isValidTable(fromSession) ? fromSession : null));
      dispatch({ type: "hydrate", state: { qty: saved?.qty ?? {}, note: saved?.note ?? "", name: saved?.name ?? "", table } });
    } catch {}
    hydrated.current = true;
  }, [initialTable]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      const { table, ...rest } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
      if (table) sessionStorage.setItem(TABLE_KEY, table);
      else sessionStorage.removeItem(TABLE_KEY);
    } catch {}
  }, [state]);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const lines = useMemo(
    () =>
      Object.entries(state.qty)
        .map(([id, qty]) => ({ item: byId.get(id), qty }))
        .filter((l): l is CartLine => Boolean(l.item && l.item.isAvailable)),
    [state.qty, byId],
  );

  const setQty = useCallback((id: string, qty: number) => dispatch({ type: "set", id, qty }), []);
  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      total: lines.reduce((s, l) => s + l.qty * l.item.price, 0),
      note: state.note,
      name: state.name,
      table: state.table,
      qtyOf: (id) => state.qty[id] ?? 0,
      setQty,
      add: (id) => dispatch({ type: "set", id, qty: (state.qty[id] ?? 0) + 1 }),
      setNote: (v) => dispatch({ type: "field", field: "note", value: v }),
      setName: (v) => dispatch({ type: "field", field: "name", value: v }),
      setTable: (v) => dispatch({ type: "table", table: v }),
      removeItems: (ids) => dispatch({ type: "remove", ids }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [lines, state, setQty],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
