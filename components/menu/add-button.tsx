"use client";

import { AnimatePresence, m } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import type { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/** "Add" pill that turns into a − qty + stepper. */
export function AddButton({ item, className, size = "md" }: { item: MenuItem; className?: string; size?: "md" | "lg" }) {
  const { qtyOf, setQty } = useCart();
  const qty = qtyOf(item.id);
  const h = size === "lg" ? "h-12 text-[15px]" : "h-10 text-sm";

  if (!item.isAvailable) {
    return (
      <span className={cn("eyebrow inline-flex items-center justify-center rounded-full bg-linen px-3 !text-[10px] text-stone", h, className)}>
        Sold out
      </span>
    );
  }

  return (
    <div className={cn("relative", h, className)}>
      <AnimatePresence initial={false} mode="popLayout">
        {qty === 0 ? (
          <m.button
            key="add"
            type="button"
            onClick={() => setQty(item.id, 1)}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Add ${item.name}`}
            className={cn(
              "flex size-full items-center justify-center gap-1.5 rounded-full border border-gold/60 bg-white font-semibold tracking-[0.14em] text-gold-deep uppercase shadow-[0_8px_20px_-12px_rgba(125,95,51,.55)] transition-colors hover:border-gold hover:bg-accent",
              h,
            )}
          >
            Add <Plus className="size-3.5" strokeWidth={2.5} />
          </m.button>
        ) : (
          <m.div
            key="stepper"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className={cn("flex size-full items-center justify-between rounded-full bg-espresso text-ivory shadow-[0_10px_22px_-12px_rgba(30,26,23,.8)]", h)}
          >
            <button
              type="button"
              onClick={() => setQty(item.id, qty - 1)}
              aria-label={`Remove one ${item.name}`}
              className="flex h-full w-10 items-center justify-center rounded-l-full text-gold-light active:bg-white/10"
            >
              <Minus className="size-4" strokeWidth={2.5} />
            </button>
            <m.span key={qty} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="min-w-5 text-center font-semibold tabular-nums" aria-live="polite">
              {qty}
            </m.span>
            <button
              type="button"
              onClick={() => setQty(item.id, qty + 1)}
              disabled={qty >= 20}
              aria-label={`Add one more ${item.name}`}
              className="flex h-full w-10 items-center justify-center rounded-r-full text-gold-light active:bg-white/10 disabled:opacity-50"
            >
              <Plus className="size-4" strokeWidth={2.5} />
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
