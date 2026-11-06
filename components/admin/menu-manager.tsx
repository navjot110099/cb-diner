"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { DietMarks } from "@/components/menu/diet-marks";
import { FoodImage } from "@/components/menu/food-image";
import { setAvailability } from "@/app/admin/actions";
import { dollars } from "@/lib/format";
import type { Category, MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Menu list with instant sold-out toggles — the thing a manager touches most during service. */
export function MenuManager({ categories, items }: { categories: Category[]; items: MenuItem[] }) {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("all");
  const [, startTransition] = useTransition();
  const [optimistic, applyOptimistic] = useOptimistic(items, (state, change: { id: string; isAvailable: boolean }) =>
    state.map((i) => (i.id === change.id ? { ...i, isAvailable: change.isAvailable } : i)),
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return optimistic.filter((i) => (section === "all" || i.categoryId === section) && (!q || `${i.name} ${i.description}`.toLowerCase().includes(q)));
  }, [optimistic, query, section]);

  const toggle = (item: MenuItem, isAvailable: boolean) => {
    startTransition(async () => {
      applyOptimistic({ id: item.id, isAvailable });
      try {
        await setAvailability(item.id, isAvailable);
        toast.success(isAvailable ? `${item.name} is back on the menu` : `${item.name} marked sold out`);
      } catch {
        toast.error(`Couldn’t update ${item.name}`);
      }
    });
  };

  return (
    <section className="rounded-3xl bg-card ring-1 ring-border">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
        <h2 className="mr-auto font-display text-2xl font-semibold">Dishes</h2>
        <label className="relative w-full sm:w-64">
          <span className="sr-only">Search dishes</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dishes"
            className="h-10 w-full rounded-full border border-input bg-white pr-3 pl-10 text-sm outline-none focus-visible:border-gold focus-visible:ring-3 focus-visible:ring-gold/25"
          />
        </label>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-border px-5 py-3">
        {[{ id: "all", name: "All" }, ...categories].map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSection(c.id)}
            className={cn(
              "h-8 shrink-0 rounded-full px-3.5 text-[13px] whitespace-nowrap ring-1 transition-colors",
              section === c.id ? "bg-espresso font-semibold text-gold-light ring-espresso" : "bg-white text-espresso-soft ring-border hover:bg-linen",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-border">
        {visible.map((item) => (
          <li key={item.id} className={cn("flex items-center gap-4 px-5 py-3.5", !item.isAvailable && "bg-linen/50")}>
            <FoodImage src={item.image?.thumb} alt="" className={cn("size-14 shrink-0 rounded-xl", !item.isAvailable && "grayscale")} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate font-semibold">
                <span className="truncate">{item.name}</span> <DietMarks isVeg={item.isVeg} tags={item.tags} />
              </p>
              <p className="text-sm text-stone">
                {categories.find((c) => c.id === item.categoryId)?.name} · <span className="font-medium text-espresso tabular-nums">{dollars(item.price)}</span>
              </p>
            </div>
            <label className="flex shrink-0 items-center gap-2.5 text-sm">
              <span className={cn("hidden w-16 text-right sm:inline", item.isAvailable ? "text-sage-deep" : "text-stone")}>{item.isAvailable ? "On menu" : "Sold out"}</span>
              <Switch
                checked={item.isAvailable}
                onCheckedChange={(v) => toggle(item, v)}
                aria-label={`${item.name} available`}
                className="data-[state=checked]:bg-sage"
              />
            </label>
            <Link
              href={`/admin/items/${item.id}`}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full ring-1 ring-border hover:bg-linen"
              aria-label={`Edit ${item.name}`}
            >
              <Pencil className="size-4" />
            </Link>
          </li>
        ))}
        {visible.length === 0 && <li className="px-5 py-10 text-center text-stone">No dishes match.</li>}
      </ul>
    </section>
  );
}
