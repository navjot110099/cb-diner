"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { rowToOrder, type OrderRow } from "@/lib/db/rows";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { Order, OrderStatus } from "@/lib/types";

export type LiveMode = { kind: "realtime"; url: string; anonKey: string } | { kind: "polling" };
export type Connection = "connecting" | "live" | "polling" | "offline";

/**
 * Keeps the kitchen's order list current.
 * - Live mode: Supabase Realtime `postgres_changes` on `orders` (row-level
 *   security limits it to staff), plus a slow safety refetch.
 * - Demo mode: polls /api/orders every 3 s, and refetches instantly when a
 *   guest places an order in another tab of the same browser.
 */
export function useLiveOrders(initial: Order[], mode: LiveMode, onArrive: (order: Order) => void) {
  const [orders, setOrders] = useState(initial);
  const [connection, setConnection] = useState<Connection>(mode.kind === "realtime" ? "connecting" : "polling");
  const known = useRef(new Set(initial.map((o) => o.id)));
  const arrive = useRef(onArrive);
  useEffect(() => {
    arrive.current = onArrive;
  });

  const noteArrivals = useCallback((list: Order[]) => {
    for (const o of list) {
      if (!known.current.has(o.id)) {
        known.current.add(o.id);
        if (o.status === "new") arrive.current(o);
      }
    }
  }, []);

  const upsert = useCallback(
    (order: Order) => {
      noteArrivals([order]);
      setOrders((prev) => {
        const i = prev.findIndex((p) => p.id === order.id);
        if (i < 0) return [order, ...prev];
        const next = [...prev];
        next[i] = order;
        return next;
      });
    },
    [noteArrivals],
  );

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (res.status === 401) {
        location.href = "/staff/login?next=/kitchen";
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { orders: Order[] };
      noteArrivals(data.orders);
      setOrders(data.orders);
      if (mode.kind === "polling") setConnection("polling");
    } catch {
      if (!navigator.onLine) setConnection("offline");
    }
  }, [mode.kind, noteArrivals]);

  useEffect(() => {
    const interval = setInterval(() => document.visibilityState === "visible" && refetch(), mode.kind === "realtime" ? 30_000 : 3_000);
    const onVisible = () => document.visibilityState === "visible" && refetch();
    const onOnline = () => refetch();
    const onOffline = () => setConnection("offline");
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    let channel: BroadcastChannel | undefined;
    try {
      channel = new BroadcastChannel("cb-orders");
      channel.onmessage = () => refetch();
    } catch {}

    let unsubscribe: (() => void) | undefined;
    if (mode.kind === "realtime") {
      const supabase = supabaseBrowser(mode.url, mode.anonKey);
      const rt = supabase
        .channel("kitchen-orders")
        .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as { id?: string }).id;
            if (id) setOrders((prev) => prev.filter((o) => o.id !== id));
            return;
          }
          upsert(rowToOrder(payload.new as OrderRow));
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnection("live");
            refetch(); // catch anything that arrived while connecting
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setConnection(navigator.onLine ? "connecting" : "offline");
          }
        });
      unsubscribe = () => void supabase.removeChannel(rt);
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      channel?.close();
      unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mode is fixed for the page's lifetime
  }, [refetch, upsert]);

  const setStatus = useCallback(async (id: string, status: OrderStatus) => {
    let previous: Order | undefined;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        previous = o;
        return { ...o, status, updatedAt: new Date().toISOString() };
      }),
    );
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { order } = (await res.json()) as { order: Order };
      setOrders((prev) => prev.map((o) => (o.id === id ? order : o)));
      try {
        new BroadcastChannel("cb-orders").postMessage({ type: "status", id });
      } catch {}
      return true;
    } catch {
      if (previous) setOrders((prev) => prev.map((o) => (o.id === id ? previous! : o)));
      return false;
    }
  }, []);

  return { orders, connection, setStatus, refetch };
}
