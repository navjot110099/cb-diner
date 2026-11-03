"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { toast } from "sonner";
import { Bell, BellOff, ChefHat, CircleCheck, LayoutDashboard, LogOut, Plus, RotateCcw, ShoppingBag, Wifi, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";
import { audioReady, playChime, unlockAudio } from "@/components/kitchen/chime";
import { useLiveOrders, type LiveMode } from "@/components/kitchen/use-live-orders";
import { signOut } from "@/app/staff/actions";
import { now as clockNow } from "@/lib/clock";
import { clockTime, dollars, elapsed } from "@/lib/format";
import type { Order, OrderStatus, StaffUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLUMNS: { status: "new" | "preparing" | "served"; title: string; hint: string; accent: string; dot: string }[] = [
  { status: "new", title: "New", hint: "Tap “Start” when you fire it", accent: "bg-gold", dot: "bg-gold" },
  { status: "preparing", title: "Firing", hint: "On the line", accent: "bg-rose-gold", dot: "bg-rose-gold" },
  { status: "served", title: "Served", hint: "Last 3 hours", accent: "bg-sage", dot: "bg-sage" },
];

const SOUND_KEY = "cb-kitchen-sound";
const SERVED_WINDOW = 3 * 3600_000;

export function KitchenBoard({ initial, mode, staff, demo }: { initial: Order[]; mode: LiveMode; staff: StaffUser; demo: boolean }) {
  const [soundOn, setSoundOn] = useState(false);
  const [now, setNow] = useState(() => clockNow());
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"new" | "preparing" | "served">("new");
  const [simulating, setSimulating] = useState(false);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);

  const onArrive = useCallback(
    (order: Order) => {
      setFresh((prev) => new Set(prev).add(order.id));
      setTimeout(() => setFresh((prev) => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      }), 12_000);
      if (soundOn) playChime();
      navigator.vibrate?.([180, 80, 180]);
      toast(`New order #${order.number}`, { description: order.table ? `Table ${order.table}` : "Pickup / bar", icon: <Bell className="size-4" /> });
    },
    [soundOn],
  );

  const { orders, connection, setStatus, refetch } = useLiveOrders(initial, mode, onArrive);

  // Minute ticker for "x min ago" and late-order colours.
  useEffect(() => {
    const id = setInterval(() => setNow(clockNow()), 20_000);
    return () => clearInterval(id);
  }, []);

  // Remember the sound preference; audio itself still needs one tap per page load.
  useEffect(() => {
    try {
      if (localStorage.getItem(SOUND_KEY) === "1") {
        const resume = () => {
          unlockAudio();
          setSoundOn(true);
        };
        window.addEventListener("pointerdown", resume, { once: true });
        return () => window.removeEventListener("pointerdown", resume);
      }
    } catch {}
  }, []);

  // Keep a kitchen tablet's screen awake while the board is open.
  useEffect(() => {
    if (!soundOn) return;
    const request = async () => {
      try {
        const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
        if (nav.wakeLock && document.visibilityState === "visible") wakeLock.current = await nav.wakeLock.request("screen");
      } catch {}
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      void wakeLock.current?.release().catch(() => {});
    };
  }, [soundOn]);

  const grouped = useMemo(() => {
    const by: Record<"new" | "preparing" | "served", Order[]> = { new: [], preparing: [], served: [] };
    for (const o of orders) {
      if (o.status === "new" || o.status === "preparing") by[o.status].push(o);
      else if (now - new Date(o.updatedAt).getTime() < SERVED_WINDOW) by.served.push(o);
    }
    by.new.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    by.preparing.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    by.served.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return by;
  }, [orders, now]);

  useEffect(() => {
    const n = grouped.new.length;
    document.title = n ? `(${n}) New order${n > 1 ? "s" : ""} · Kitchen` : "Kitchen · CB Diner";
  }, [grouped.new.length]);

  const toggleSound = () => {
    if (soundOn) {
      setSoundOn(false);
      try {
        localStorage.setItem(SOUND_KEY, "0");
      } catch {}
      return;
    }
    unlockAudio();
    setSoundOn(true);
    try {
      localStorage.setItem(SOUND_KEY, "1");
    } catch {}
    setTimeout(() => audioReady() && playChime(), 60);
  };

  const move = async (order: Order, status: OrderStatus) => {
    const ok = await setStatus(order.id, status);
    if (!ok) toast.error(`Couldn’t update #${order.number}. Check the connection.`);
  };

  const simulate = async () => {
    setSimulating(true);
    try {
      await fetch("/api/demo/simulate-order", { method: "POST" });
      await refetch();
    } finally {
      setSimulating(false);
    }
  };

  const todayRevenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

  return (
    <div className="flex min-h-dvh flex-col bg-linen">
      <header className="bg-night sticky top-0 z-30 text-ivory">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <LogoMark tone="light" className="size-10" />
          <div className="mr-auto leading-tight">
            <h1 className="font-display text-2xl leading-none font-semibold">Kitchen</h1>
            <p className="mt-0.5 text-xs text-ivory/60">
              {staff.name} · {grouped.new.length + grouped.preparing.length} open · {dollars(todayRevenue)} today
            </p>
          </div>
          <ConnectionPill connection={connection} realtime={mode.kind === "realtime"} />
          {demo && (
            <Button size="sm" onClick={simulate} disabled={simulating} className="h-9 rounded-full bg-white/8 px-3 text-ivory ring-1 ring-white/20 hover:bg-white/15">
              <Plus /> Simulate order
            </Button>
          )}
          <Button
            size="sm"
            onClick={toggleSound}
            aria-pressed={soundOn}
            className={cn(
              "h-9 rounded-full px-3",
              soundOn ? "bg-sage text-white hover:bg-sage/90" : "animate-ring-pulse bg-gold text-espresso hover:opacity-90",
            )}
          >
            {soundOn ? <Bell /> : <BellOff />} {soundOn ? "Sound on" : "Enable sound"}
          </Button>
          {staff.role === "admin" && (
            <Link href="/admin" className="inline-flex size-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 hover:bg-white/20" aria-label="Admin">
              <LayoutDashboard className="size-4" />
            </Link>
          )}
          <form action={signOut}>
            <button className="inline-flex size-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 hover:bg-white/20" aria-label="Sign out">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
        {/* Phone/tablet: one column at a time */}
        <div role="tablist" aria-label="Order status" className="grid grid-cols-3 gap-1 px-3 pb-3 lg:hidden">
          {COLUMNS.map((col) => (
            <button
              key={col.status}
              role="tab"
              aria-selected={tab === col.status}
              onClick={() => setTab(col.status)}
              className={cn(
                "flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors",
                tab === col.status ? "bg-ivory text-espresso" : "bg-white/8 text-ivory/80",
              )}
            >
              <span className={cn("size-2 rounded-full", col.dot)} />
              {col.title}
              <span className="tabular-nums opacity-70">{grouped[col.status].length}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="grid flex-1 gap-4 p-3 sm:p-4 lg:grid-cols-3 lg:gap-5 lg:p-6">
        {COLUMNS.map((col) => (
          <section
            key={col.status}
            aria-label={col.title}
            className={cn("min-w-0 flex-col lg:flex", tab === col.status ? "flex" : "hidden")}
          >
            <div className="mb-3 hidden items-center gap-3 lg:flex">
              <span className={cn("h-7 w-1.5 rounded-full", col.accent)} />
              <h2 className="text-lg font-bold">{col.title}</h2>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-sm font-semibold tabular-nums ring-1 ring-border">{grouped[col.status].length}</span>
              <span className="ml-auto text-xs text-stone">{col.hint}</span>
            </div>
            <div className="space-y-3">
              <AnimatePresence initial={false} mode="popLayout">
                {grouped[col.status].map((order) => (
                  <Ticket key={order.id} order={order} now={now} fresh={fresh.has(order.id)} onMove={move} />
                ))}
              </AnimatePresence>
              {grouped[col.status].length === 0 && (
                <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-linen-deep px-6 py-12 text-center text-stone">
                  {col.status === "new" ? <ShoppingBag className="mb-2 size-7" /> : col.status === "preparing" ? <ChefHat className="mb-2 size-7" /> : <CircleCheck className="mb-2 size-7" />}
                  <p className="text-sm font-medium">{col.status === "new" ? "No new orders. New tickets ring the bell." : col.status === "preparing" ? "Nothing on the line." : "Nothing served yet."}</p>
                </div>
              )}
            </div>
          </section>
        ))}
      </main>
      <footer className="px-6 pb-4 text-center text-xs text-stone">Demo project by OVIOWEB</footer>
    </div>
  );
}

function ConnectionPill({ connection, realtime }: { connection: string; realtime: boolean }) {
  const label =
    connection === "live" ? "Live · Realtime" : connection === "polling" ? (realtime ? "Live · syncing" : "Live · demo sync 3s") : connection === "offline" ? "Offline" : "Connecting…";
  const ok = connection === "live" || connection === "polling";
  return (
    <span className={cn("hidden h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold ring-1 sm:inline-flex", ok ? "bg-white/8 ring-white/15" : "bg-rose-gold ring-rose-gold")}>
      {ok ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
      {ok && <span className="size-1.5 animate-pulse rounded-full bg-[#4ade80]" />}
      {label}
    </span>
  );
}

function Ticket({
  order,
  now,
  fresh,
  onMove,
}: {
  order: Order;
  now: number;
  fresh: boolean;
  onMove: (order: Order, status: OrderStatus) => void;
}) {
  const mins = (now - new Date(order.createdAt).getTime()) / 60000;
  const open = order.status === "new" || order.status === "preparing";
  const late = open && mins >= 20;
  const warm = open && mins >= 10 && !late;
  const items = order.lines.reduce((s, l) => s + l.qty, 0);
  const [confirmCancel, setConfirmCancel] = useState(false);

  return (
    <m.article
      layout
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={cn(
        "overflow-hidden rounded-2xl bg-card shadow-[0_10px_30px_-22px_rgba(43,26,20,.6)] ring-1",
        fresh ? "animate-ticket-in ring-2 ring-gold" : late ? "ring-2 ring-rose-gold/70" : "ring-border",
        order.status === "served" || order.status === "cancelled" ? "opacity-80" : "",
      )}
    >
      <div className={cn("flex items-center gap-3 border-b border-dashed border-border px-4 py-3", order.status === "cancelled" && "bg-linen")}>
        <span
          className={cn(
            "flex h-12 min-w-12 flex-col items-center justify-center rounded-xl px-2 leading-none font-bold",
            order.table ? "bg-espresso text-gold-light" : "bg-gold text-espresso",
          )}
        >
          {order.table ? (
            <>
              <span className="text-[10px] font-semibold tracking-wider opacity-75">TABLE</span>
              <span className="text-xl tabular-nums">{order.table}</span>
            </>
          ) : (
            <span className="text-[11px] tracking-wider">PICK
              <br />UP</span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-bold">
            #{order.number}
            {fresh && <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold tracking-wider text-espresso">NEW</span>}
          </p>
          <p className="text-xs text-stone">
            {clockTime(order.createdAt)} · {items} items · {dollars(order.total)}
            {order.customerName ? ` · ${order.customerName}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "rounded-lg px-2 py-1 text-sm font-bold tabular-nums",
            late ? "bg-rose-gold text-white" : warm ? "bg-gold-light/50 text-espresso" : "bg-linen text-stone",
          )}
          title="Time since order"
        >
          {order.status === "served" ? "✓" : order.status === "cancelled" ? "✕" : elapsed(order.createdAt, now)}
        </span>
      </div>

      <ul className="space-y-1.5 px-4 py-3">
        {order.lines.map((l) => (
          <li key={l.itemId} className={cn("flex items-start gap-2.5 text-[15px] leading-snug", order.status === "cancelled" && "line-through opacity-60")}>
            <span className="min-w-7 rounded-md bg-espresso px-1.5 py-0.5 text-center text-sm font-bold text-ivory tabular-nums">{l.qty}</span>
            <span className="font-semibold">{l.name}</span>
          </li>
        ))}
      </ul>
      {order.note && (
        <p className="mx-4 mb-3 rounded-lg border-l-4 border-gold bg-gold-light/25 px-3 py-2 text-sm font-semibold text-espresso">“{order.note}”</p>
      )}

      <div className="flex items-center gap-2 border-t border-border bg-ivory/70 px-3 py-2.5">
        {order.status === "new" && (
          <>
            <Button onClick={() => onMove(order, "preparing")} className="bg-gold h-11 flex-1 rounded-xl text-[15px] font-semibold text-espresso">
              <ChefHat /> Start / fire
            </Button>
            {confirmCancel ? (
              <Button variant="destructive" className="h-11 rounded-xl" onClick={() => onMove(order, "cancelled")}>
                Cancel order?
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="size-11 rounded-xl text-stone" aria-label={`Cancel order ${order.number}`} onClick={() => setConfirmCancel(true)}>
                <X />
              </Button>
            )}
          </>
        )}
        {order.status === "preparing" && (
          <>
            <Button onClick={() => onMove(order, "served")} className="h-11 flex-1 rounded-xl bg-espresso text-[15px] font-semibold text-ivory hover:bg-espresso-soft">
              <CircleCheck /> Mark served
            </Button>
            <Button variant="ghost" size="icon" className="size-11 rounded-xl text-stone" aria-label={`Move order ${order.number} back to new`} onClick={() => onMove(order, "new")}>
              <RotateCcw />
            </Button>
          </>
        )}
        {(order.status === "served" || order.status === "cancelled") && (
          <>
            <span className={cn("flex-1 px-1 text-sm font-semibold", order.status === "served" ? "text-sage" : "text-rose-gold")}>
              {order.status === "served" ? `Served ${clockTime(order.updatedAt)}` : "Cancelled"}
            </span>
            <Button variant="ghost" size="sm" className="h-9 rounded-lg text-stone" onClick={() => onMove(order, "preparing")}>
              <RotateCcw /> Undo
            </Button>
          </>
        )}
      </div>
    </m.article>
  );
}
