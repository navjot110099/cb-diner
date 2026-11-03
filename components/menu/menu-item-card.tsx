"use client";

import { memo } from "react";
import { AddButton } from "@/components/menu/add-button";
import { DietMarks, NO_DIET_MARKS } from "@/components/menu/diet-marks";
import { DishTags } from "@/components/menu/dish-tags";
import { FoodImage } from "@/components/menu/food-image";
import { dollars } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export const MenuItemCard = memo(function MenuItemCard({ item, onOpen, priority = false }: { item: MenuItem; onOpen: (item: MenuItem) => void; priority?: boolean }) {
  const soldOut = !item.isAvailable;
  return (
    <article id={`dish-${item.id}`} className={cn("group flex gap-4 py-6", soldOut && "opacity-60")} aria-labelledby={`dish-${item.id}-name`}>
      <div className="min-w-0 flex-1">
        <DishTags tags={item.tags} />
        <h3 id={`dish-${item.id}-name`} className="mt-1.5 font-display text-[1.35rem] leading-[1.15] font-semibold text-espresso">
          <button type="button" onClick={() => onOpen(item)} className="text-left decoration-gold/60 underline-offset-4 hover:underline focus-visible:underline">
            {item.name}
          </button>
        </h3>
        <div className="mt-1.5 flex items-center gap-2.5">
          <span className="font-semibold text-espresso tabular-nums">{dollars(item.price)}</span>
          {!NO_DIET_MARKS.has(item.categoryId) && <DietMarks isVeg={item.isVeg} tags={item.tags} />}
        </div>
        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-stone">{item.description}</p>
      </div>

      <div className={cn("relative flex w-[118px] shrink-0 flex-col items-center", item.image ? "pb-4" : "justify-center")}>
        {item.image && (
          <button type="button" onClick={() => onOpen(item)} className="block overflow-hidden rounded-2xl ring-1 ring-black/5" aria-label={item.name} tabIndex={-1}>
            <FoodImage src={item.image.thumb} alt={item.name} priority={priority} className={cn("size-[118px] transition-transform duration-500 group-hover:scale-[1.05]", soldOut && "grayscale")} />
          </button>
        )}
        <AddButton item={item} className={cn("w-[100px]", item.image ? "absolute -bottom-1" : "")} />
      </div>
    </article>
  );
});
