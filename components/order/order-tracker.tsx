"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { Check, ChefHat, CircleX, ClipboardList, ConciergeBell, UtensilsCrossed } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { InstallCard } from "@/components/pwa/install-card";
import { WhatsAppIcon } from "@/components/site/icons";
import { clockTime, dollars } from "@/lib/format";
import { restaurant } from "@/lib/restaurant";
import type { Order, OrderStatus } from "@/lib/types";
import { whatsappOrderLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const STEPS: { status: Exclude<OrderStatus, "cancelled">; label: string; icon: typeof Check }[] = [
  { status: "new", label: "Received", icon: ClipboardList },
  { status: "preparing", label: "In the kitchen", icon: ChefHat },
  { status: "served", label: "Served", icon: ConciergeBell },
];

const HEADLINE: Record<OrderStatus, string> = {
  new: "The kitchen has your order",
  preparing: "Our chefs are on it",
  served: "Enjoy your meal",
  cancelled: "This order was cancelled",
};

/** Guest view of one order. Polls every few seconds until it's served. */
export function OrderTracker({ initial, justPlaced }: { initial: Order; justPlaced: boolean }) {
  const [order, setOrder] = useState(initial);
  const done = order.status === "served" || order.status === "cancelled";

  useEffect(() => {
    if (done) return;
    let stopped = false;
    const refresh = async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`, { cache: "no-store" });
        if (res.ok && !stopped) setOrder((await res.json()).order);
      } catch {}
    };
    const id = setInterval(() => document.visibilityState === "visible" && refresh(), 5000);
    let channel: BroadcastChannel | undefined;
    try {
      channel = new BroadcastChannel("cb-orders");
      channel.onmessage = (e) => e.data?.id === order.id && refresh();
    } catch {}
    return () => {
      stopped = true;
      clearInterval(id);
      channel?.close();
    };
  }, [order.id, done]);

  const stepIndex = STEPS.findIndex((s) => s.status === order.status);
  const menuHref = order.table ? `/menu?table=${order.table}` : "/menu";
  const waLink = whatsappOrderLink({ lines: order.lines, table: order.table, number: order.number, note: order.note });

  return (
    <div className="min-h-dvh bg-ivory">
      <header className="bg-night relative isolate overflow-hidden text-ivory">
        <span className="bg-gold absolute inset-x-0 bottom-0 h-px opacity-60" aria-hidden="true" />
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-5 sm:px-6">
          <Link href={menuHref} aria-label="Back to the menu">
            <Logo tone="light" />
          </Link>
          <a href={restaurant.phoneHref} className="text-sm text-ivory/70 underline-offset-4 hover:text-ivory hover:underline">
            {restaurant.phone}
          </a>
        </div>
        <div className="mx-auto max-w-2xl px-5 pt-6 pb-24 text-center sm:px-6">
          <m.span
            initial={justPlaced ? { scale: 0.5, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            className={cn(
              "mx-auto flex size-18 items-center justify-center rounded-full ring-1 ring-gold/40",
              order.status === "cancelled" ? "bg-rose-gold text-ivory" : "bg-gold text-espresso",
            )}
          >
            {order.status === "cancelled" ? <CircleX className="size-8" /> : <Check className="size-8" strokeWidth={2.5} />}
          </m.span>
          <p className="eyebrow mt-6 text-gold-light">
            Order #{order.number} · {order.table ? `Table ${order.table}` : "Pickup / bar"}
          </p>
          <h1 className="mt-2 font-display text-[2.4rem] leading-tight font-semibold sm:text-5xl">
            {justPlaced && order.status === "new" ? "Thank you — order placed" : HEADLINE[order.status]}
          </h1>
          <p className="mt-2 text-ivory/70">
            {order.status === "cancelled" ? "Please speak to your server." : `Placed at ${clockTime(order.createdAt)}. Sit back — we’ll bring everything to you.`}
          </p>
        </div>
      </header>

      <main className="relative z-10 mx-auto -mt-14 max-w-2xl space-y-5 px-4 pb-16 sm:px-6">
        {order.status !== "cancelled" && (
          <section aria-label="Live status" className="rounded-3xl bg-card p-6 shadow-[0_24px_60px_-36px_rgba(30,26,23,.6)] ring-1 ring-border">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="eyebrow text-stone">Live status</h2>
              {!done && (
                <span className="eyebrow inline-flex items-center gap-1.5 !text-[10px] text-sage">
                  <span className="size-1.5 animate-pulse rounded-full bg-sage" /> Live
                </span>
              )}
            </div>
            <ol className="relative grid grid-cols-3 gap-2">
              <span className="absolute top-6 right-[16.6%] left-[16.6%] h-px bg-border" aria-hidden="true" />
              <m.span
                className="bg-gold absolute top-6 left-[16.6%] h-px"
                initial={false}
                animate={{ width: `${(Math.max(0, stepIndex) / 2) * 66.8}%` }}
                aria-hidden="true"
              />
              {STEPS.map((step, i) => {
                const reached = i <= stepIndex;
                const Icon = step.icon;
                return (
                  <li key={step.status} className="relative flex flex-col items-center text-center" aria-current={i === stepIndex ? "step" : undefined}>
                    <span
                      className={cn(
                        "relative flex size-12 items-center justify-center rounded-full ring-4 ring-card transition-colors",
                        reached ? "bg-espresso text-gold-light" : "bg-linen text-stone",
                        i === stepIndex && !done && "animate-ring-pulse",
                      )}
                    >
                      <Icon className="size-5" strokeWidth={1.75} />
                    </span>
                    <span className={cn("mt-3 text-sm font-semibold", reached ? "text-espresso" : "text-stone")}>{step.label}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <section className="rounded-3xl bg-card p-6 ring-1 ring-border">
          <h2 className="eyebrow mb-2 text-stone">Your order</h2>
          <ul className="divide-y divide-border">
            {order.lines.map((l) => (
              <li key={l.itemId} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-semibold tabular-nums">{l.qty} ×</span> {l.name}
                </span>
                <span className="font-medium tabular-nums">{dollars(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          {order.note && <p className="mt-2 rounded-xl bg-linen px-3 py-2 text-sm italic">“{order.note}”</p>}
          <div className="mt-3 flex items-baseline justify-between border-t border-border pt-4">
            <span className="eyebrow text-stone">Subtotal</span>
            <span className="font-display text-[1.75rem] font-semibold tabular-nums">{dollars(order.total)}</span>
          </div>
          <p className="mt-1 text-xs text-stone">{restaurant.taxNote} Your server will bring the check.</p>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-white font-semibold text-espresso ring-1 ring-border hover:bg-linen"
          >
            <WhatsAppIcon className="size-5 text-[#25a35a]" /> Send a copy on WhatsApp
          </a>
          <Link href={menuHref} className="flex h-12 items-center justify-center gap-2 rounded-full bg-espresso font-semibold text-ivory hover:bg-espresso-soft">
            <UtensilsCrossed className="size-4 text-gold-light" /> Order more
          </Link>
        </div>

        <InstallCard />

        <p className="pt-4 text-center text-xs text-stone">Demo project by OVIOWEB</p>
      </main>
    </div>
  );
}
