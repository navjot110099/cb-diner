"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ConciergeBell, Loader2, Minus, Plus, Trash2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppIcon } from "@/components/site/icons";
import { useCart } from "@/components/cart/cart-context";
import { useOnline } from "@/components/pwa/pwa";
import { dollars } from "@/lib/format";
import { restaurant } from "@/lib/restaurant";
import { whatsappOrderLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const PICKUP = "pickup";

export function rememberOrder(id: string) {
  try {
    const list = JSON.parse(localStorage.getItem("cb-orders") || "[]") as string[];
    localStorage.setItem("cb-orders", JSON.stringify([id, ...list.filter((x) => x !== id)].slice(0, 10)));
  } catch {}
}

/** Order review + checkout, shared by the phone bottom sheet and the desktop side panel. */
export function CartContents({ variant, onPlaced }: { variant: "sheet" | "panel"; onPlaced?: () => void }) {
  const cart = useCart();
  const online = useOnline();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <span className="mb-4 flex size-16 items-center justify-center rounded-full border border-gold/40 bg-accent text-gold-deep">
          <ConciergeBell className="size-7" strokeWidth={1.5} />
        </span>
        <p className="font-display text-2xl font-semibold">Your order is empty</p>
        <p className="mt-1 max-w-60 text-sm text-stone">Tap “Add” on any dish and it will appear here.</p>
      </div>
    );
  }

  const waLink = whatsappOrderLink({
    lines: cart.lines.map((l) => ({ name: l.item.name, qty: l.qty, price: l.item.price })),
    table: cart.table,
    note: cart.note.trim() || null,
    name: cart.name.trim() || null,
  });

  async function placeOrder() {
    setPlacing(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: cart.table,
          customerName: cart.name.trim() || null,
          note: cart.note.trim() || null,
          lines: cart.lines.map((l) => ({ itemId: l.item.id, qty: l.qty })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && Array.isArray(data.itemIds)) {
        const names = cart.lines.filter((l) => data.itemIds.includes(l.item.id)).map((l) => l.item.name);
        cart.removeItems(data.itemIds);
        setError(`Sorry — ${names.join(", ")} just sold out, so we removed it from your order.`);
        router.refresh();
        return;
      }
      if (!res.ok || !data.order?.id) throw new Error(data.error || "Order failed");
      rememberOrder(data.order.id);
      try {
        new BroadcastChannel("cb-orders").postMessage({ type: "created", id: data.order.id });
      } catch {}
      cart.clear();
      onPlaced?.();
      router.push(`/order/${data.order.id}?placed=1`);
    } catch {
      setError("We couldn’t send your order. Please try again, or ask your server.");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", variant === "panel" && "overflow-hidden")}>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
        <ul className="divide-y divide-border">
          {cart.lines.map(({ item, qty }) => (
            <li key={item.id} className="flex items-center gap-3 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[15px] leading-snug font-medium">{item.name}</p>
                <p className="text-[13px] text-stone tabular-nums">{dollars(item.price)}</p>
              </div>
              <div className="flex h-9 items-center rounded-full border border-border bg-white">
                <button
                  type="button"
                  className="flex h-full w-8 items-center justify-center text-gold-deep"
                  onClick={() => cart.setQty(item.id, qty - 1)}
                  aria-label={qty === 1 ? `Remove ${item.name}` : `Remove one ${item.name}`}
                >
                  {qty === 1 ? <Trash2 className="size-3.5" /> : <Minus className="size-3.5" strokeWidth={2.5} />}
                </button>
                <span className="w-5 text-center text-sm font-semibold tabular-nums">{qty}</span>
                <button
                  type="button"
                  className="flex h-full w-8 items-center justify-center text-gold-deep disabled:opacity-40"
                  disabled={qty >= 20}
                  onClick={() => cart.setQty(item.id, qty + 1)}
                  aria-label={`Add one more ${item.name}`}
                >
                  <Plus className="size-3.5" strokeWidth={2.5} />
                </button>
              </div>
              <p className="w-14 text-right text-[15px] font-semibold tabular-nums">{dollars(item.price * qty)}</p>
            </li>
          ))}
        </ul>

        <div className="space-y-4 border-t border-border py-5">
          <div className="grid gap-1.5">
            <Label htmlFor={`${variant}-table`} className="eyebrow text-stone">
              Table
            </Label>
            {/* Native picker: lighter than a custom dropdown and opens the phone's own wheel. */}
            <div className="relative">
              <select
                id={`${variant}-table`}
                value={cart.table ?? PICKUP}
                onChange={(e) => cart.setTable(e.target.value === PICKUP ? null : e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-input bg-white pr-10 pl-3 text-[15px] outline-none focus-visible:border-gold focus-visible:ring-3 focus-visible:ring-gold/25"
              >
                <option value={PICKUP}>Pickup / bar</option>
                {Array.from({ length: restaurant.tableCount }, (_, i) => String(i + 1)).map((n) => (
                  <option key={n} value={n}>
                    Table {n}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-stone" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${variant}-name`} className="eyebrow text-stone">
              Name <span className="tracking-normal normal-case">(optional)</span>
            </Label>
            <Input
              id={`${variant}-name`}
              value={cart.name}
              maxLength={40}
              autoComplete="given-name"
              onChange={(e) => cart.setName(e.target.value)}
              placeholder="So your server knows who’s who"
              className="h-11 rounded-xl bg-white text-[15px]"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${variant}-note`} className="eyebrow text-stone">
              Note for the kitchen
            </Label>
            <Textarea
              id={`${variant}-note`}
              value={cart.note}
              maxLength={240}
              rows={2}
              onChange={(e) => cart.setNote(e.target.value)}
              placeholder="Steak temperature, allergies, sauce on the side…"
              className="min-h-16 rounded-xl bg-white text-[15px]"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-border bg-card px-5 pt-4 pb-safe">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow text-stone">Subtotal</span>
          <span className="font-display text-[1.75rem] font-semibold tabular-nums">{dollars(cart.total)}</span>
        </div>
        <p className="text-xs leading-relaxed text-stone">{restaurant.taxNote}</p>
        {error && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {!online && (
          <p role="status" className="flex items-start gap-2 rounded-xl bg-linen px-3 py-2 text-sm">
            <WifiOff className="mt-0.5 size-4 shrink-0" /> You’re offline. Send the order on WhatsApp, or ask your server.
          </p>
        )}
        <Button
          size="lg"
          onClick={placeOrder}
          disabled={placing || !online}
          className="bg-gold h-13 w-full rounded-full text-[15px] font-semibold tracking-wide text-espresso shadow-[0_16px_32px_-16px_rgba(125,95,51,.9)] hover:opacity-95"
        >
          {placing ? (
            <>
              <Loader2 className="animate-spin" /> Sending to the kitchen…
            </>
          ) : (
            `Place order · ${dollars(cart.total)}`
          )}
        </Button>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-white text-[14px] font-semibold text-espresso-soft transition-colors hover:bg-linen"
        >
          <WhatsAppIcon className="size-[18px] text-[#25a35a]" /> Send on WhatsApp instead
        </a>
        <div className="pb-3" />
      </div>
    </div>
  );
}
