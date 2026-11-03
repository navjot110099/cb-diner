"use client";

import { AnimatePresence, m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { dollars } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Floating "3 items · $186 — View order" bar for phones and tablets. */
export function CartBar({ onOpen, className }: { onOpen: () => void; className?: string }) {
  const { count, total, table } = useCart();

  return (
    <AnimatePresence>
      {count > 0 && (
        <m.div
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          className={cn("fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),12px)]", className)}
        >
          <button
            type="button"
            onClick={onOpen}
            className="bg-night relative mx-auto flex h-16 w-full max-w-xl items-center gap-3.5 overflow-hidden rounded-2xl px-4 text-left text-ivory shadow-[0_22px_44px_-18px_rgba(20,17,16,.85)] ring-1 ring-gold/30 active:scale-[.99]"
          >
            <span className="bg-gold absolute inset-x-0 top-0 h-px opacity-80" aria-hidden="true" />
            <m.span
              key={count}
              initial={{ scale: 1.35 }}
              animate={{ scale: 1 }}
              className="bg-gold flex size-10 items-center justify-center rounded-full text-[15px] font-bold text-espresso tabular-nums"
            >
              {count}
            </m.span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="text-[15px] font-semibold tabular-nums">
                {count === 1 ? "1 item" : `${count} items`} · {dollars(total)}
              </span>
              <span className="truncate text-xs text-ivory/65">{table ? `Table ${table}` : "Pickup / bar"}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[14px] font-semibold tracking-wide text-gold-light">
              View order <ArrowRight className="size-4" />
            </span>
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}
