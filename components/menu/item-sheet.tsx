"use client";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { AddButton } from "@/components/menu/add-button";
import { DietMarks, NO_DIET_MARKS } from "@/components/menu/diet-marks";
import { DishTags } from "@/components/menu/dish-tags";
import { FoodImage } from "@/components/menu/food-image";
import { useCart } from "@/components/cart/cart-context";
import { dollars } from "@/lib/format";
import type { MenuItem } from "@/lib/types";

const DIET_LABELS: Record<string, string> = { gf: "Gluten-free", vegan: "Vegan" };

/** Dish detail: bottom sheet on phones, centred card on larger screens. */
export function ItemSheet({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  const { qtyOf } = useCart();
  const diet = item && !NO_DIET_MARKS.has(item.categoryId) ? [item.isVeg && !item.tags.includes("vegan") ? "Vegetarian" : null, ...item.tags.map((t) => DIET_LABELS[t] ?? null)].filter(Boolean) : [];

  return (
    <Sheet open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] gap-0 overflow-y-auto rounded-t-[1.75rem] border-0 p-0 md:inset-x-auto! md:bottom-8! md:left-[calc(50%-280px)]! md:w-[560px] md:rounded-[1.75rem] [&>[data-slot=sheet-close]]:bg-white/85 [&>[data-slot=sheet-close]]:backdrop-blur"
      >
        {item && (
          <>
            <div className="relative">
              {item.image ? (
                <FoodImage src={item.image.full} alt={item.name} priority className="aspect-[4/3] w-full md:rounded-t-[1.75rem]" />
              ) : (
                <div className="bg-gold h-2 w-full md:rounded-t-[1.75rem]" />
              )}
              <span className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/80 md:hidden" aria-hidden="true" />
            </div>
            <div className="space-y-3 p-6 pb-safe sm:p-7">
              <DishTags tags={item.tags} />
              <SheetTitle className="font-display text-[2rem] leading-tight font-semibold text-espresso">{item.name}</SheetTitle>
              <SheetDescription className="text-[15px] leading-relaxed text-stone">{item.description}</SheetDescription>
              {diet.length > 0 && (
                <p className="flex items-center gap-2 text-sm text-stone">
                  <DietMarks isVeg={item.isVeg} tags={item.tags} /> {diet.join(" · ")}
                </p>
              )}
              <div className="gold-rule !mt-5" />
              <div className="flex items-center justify-between gap-4 pt-2 pb-4">
                <div>
                  <p className="font-display text-3xl font-semibold tabular-nums">{dollars(item.price)}</p>
                  {qtyOf(item.id) > 0 && <p className="text-xs text-stone">{qtyOf(item.id)} in your order</p>}
                </div>
                <AddButton item={item} size="lg" className="w-36" />
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
