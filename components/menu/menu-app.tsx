"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Phone, Search, Star, WifiOff, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Logo } from "@/components/brand/logo";
import { CartProvider, useCart } from "@/components/cart/cart-context";
import { CartBar } from "@/components/cart/cart-bar";
import { CartContents } from "@/components/cart/cart-contents";
import { ItemSheet } from "@/components/menu/item-sheet";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import { InstallButton } from "@/components/pwa/install-card";
import { useOnline } from "@/components/pwa/pwa";
import { OpenStatusBadge } from "@/components/site/open-status";
import { restaurant } from "@/lib/restaurant";
import type { Category, MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = { categories: Category[]; items: MenuItem[]; initialTable: string | null };

export function MenuApp({ categories, items, initialTable }: Props) {
  return (
    <CartProvider items={items} initialTable={initialTable}>
      <MenuScreen categories={categories} items={items} />
    </CartProvider>
  );
}

const normalize = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

function MenuScreen({ categories, items }: Omit<Props, "initialTable">) {
  const { table, count } = useCart();
  const online = useOnline();
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [openItem, setOpenItem] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [active, setActive] = useState(categories[0]?.id ?? "");
  const deferredQuery = useDeferredValue(query);
  const chipRow = useRef<HTMLDivElement>(null);
  const spyPaused = useRef(0);

  const index = useMemo(
    () =>
      new Map(
        items.map((i) => {
          const cat = categories.find((c) => c.id === i.categoryId);
          return [i.id, normalize([i.name, i.description, cat?.name].join(" "))];
        }),
      ),
    [items, categories],
  );

  const sections = useMemo(() => {
    const q = normalize(deferredQuery.trim());
    return categories
      .map((cat) => ({
        cat,
        items: items.filter((i) => i.categoryId === cat.id && (!vegOnly || i.isVeg) && (!q || index.get(i.id)!.includes(q))),
      }))
      .filter((s) => s.items.length > 0);
  }, [categories, items, deferredQuery, vegOnly, index]);

  const resultCount = sections.reduce((n, s) => n + s.items.length, 0);

  // Scroll-spy: highlight the category whose heading sits under the sticky bar.
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(`cat-${s.cat.id}`)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < spyPaused.current) return;
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("cat-", ""));
      },
      { rootMargin: "-150px 0px -55% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  // Keep the active chip centred in the horizontal chip row.
  useEffect(() => {
    const row = chipRow.current;
    const chip = row?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    if (row && chip) row.scrollTo({ left: chip.offsetLeft - row.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const jumpTo = useCallback((id: string) => {
    spyPaused.current = Date.now() + 800;
    setActive(id);
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const openDish = useCallback((item: MenuItem) => setOpenItem(item), []);

  return (
    <div className="min-h-dvh bg-ivory">
      {/* Welcome banner */}
      <header className="relative isolate overflow-hidden bg-espresso text-ivory">
        <picture>
          <source media="(min-width: 768px)" srcSet="/img/hero-dining.webp" />
          { }
          <img src="/img/hero-dining-sm.webp" alt="" fetchPriority="high" className="absolute inset-0 -z-20 size-full object-cover" />
        </picture>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(20,17,16,.94)_0%,rgba(30,26,23,.82)_45%,rgba(30,26,23,.45)_80%,rgba(156,107,90,.25)_100%)]" />
        <span className="bg-gold absolute inset-x-0 bottom-0 h-px opacity-70" aria-hidden="true" />
        <div className="mx-auto flex max-w-[1360px] flex-col gap-6 px-4 pt-5 pb-7 sm:px-6 lg:px-8 lg:pt-6 lg:pb-10">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" aria-label="CB Diner home">
              <Logo tone="light" />
            </Link>
            <div className="flex items-center gap-2">
              <InstallButton className="hidden border-white/20 bg-white/5 text-ivory hover:bg-white/15 hover:text-ivory md:inline-flex" />
              <a
                href={restaurant.phoneHref}
                aria-label={`Call ${restaurant.phone}`}
                className="inline-flex size-10 items-center justify-center rounded-full bg-white/6 ring-1 ring-white/15 hover:bg-white/15 sm:h-9 sm:w-auto sm:gap-2 sm:px-3.5 sm:text-sm"
              >
                <Phone className="size-4 text-gold-light" /> <span className="hidden sm:inline">Call</span>
              </a>
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-xl">
              <p className="eyebrow text-gold-light">{table ? `Table ${table}` : "The dining room"}</p>
              <h1 className="mt-2 font-display text-[2.35rem] leading-[1.02] font-semibold sm:text-5xl">{table ? "Welcome to your table" : "Welcome to CB Diner"}</h1>
              <p className="mt-2.5 text-[15px] text-ivory/75">Order from your phone — it goes straight to our kitchen.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <OpenStatusBadge tone="dark" />
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/8 px-3.5 text-[13px] ring-1 ring-white/15">
                <Star className="size-3.5 fill-gold-light text-gold-light" />
                <span className="font-semibold">{restaurant.rating}</span>
                <span className="text-ivory/65">· {restaurant.reviewCount.toLocaleString("en-US")} Google reviews</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {!online && (
        <p role="status" className="flex items-center justify-center gap-2 bg-espresso-soft px-4 py-2 text-center text-[13px] text-ivory">
          <WifiOff className="size-4" /> You’re offline — showing the saved menu.
        </p>
      )}

      {/* Sticky search + categories */}
      <div className="sticky top-0 z-30 border-b border-border bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/85">
        <div className="mx-auto flex max-w-[1360px] items-center gap-3 px-4 pt-3 pb-2.5 sm:px-6 lg:px-8 lg:py-3.5">
          <label className="relative flex-1 lg:max-w-xl">
            <span className="sr-only">Search the menu</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-[17px] -translate-y-1/2 text-stone" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search steak, lobster, martini…"
              enterKeyHint="search"
              className="h-11 w-full rounded-full border border-input bg-white pr-10 pl-11 text-[15px] outline-none placeholder:text-stone/70 focus-visible:border-gold focus-visible:ring-3 focus-visible:ring-gold/25 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-stone hover:bg-linen" aria-label="Clear search">
                <X className="size-4" />
              </button>
            )}
          </label>
          <label className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-input bg-white pr-2.5 pl-3.5 text-[13px] font-semibold">
            <span className="inline-flex size-[18px] items-center justify-center rounded-full border border-sage/50 text-[9.5px] font-bold text-sage">V</span>
            <span className="hidden min-[400px]:inline">Vegetarian</span>
            <Switch checked={vegOnly} onCheckedChange={setVegOnly} aria-label="Show vegetarian dishes only" className="data-[state=checked]:bg-sage" />
          </label>
        </div>
        <nav aria-label="Menu sections" className="lg:hidden">
          <div ref={chipRow} className="no-scrollbar mx-auto flex max-w-[1360px] gap-2 overflow-x-auto px-4 pb-3 sm:px-6">
            {sections.map(({ cat }) => (
              <button
                key={cat.id}
                type="button"
                data-cat={cat.id}
                onClick={() => jumpTo(cat.id)}
                aria-current={active === cat.id ? "true" : undefined}
                className={cn(
                  "h-9 shrink-0 rounded-full px-4 text-[13.5px] font-medium whitespace-nowrap ring-1 transition-colors",
                  active === cat.id ? "bg-espresso text-gold-light ring-espresso" : "bg-white text-espresso-soft ring-border hover:bg-linen",
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </nav>
      </div>

      <div className="mx-auto grid max-w-[1360px] gap-10 px-4 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:px-8 xl:grid-cols-[200px_minmax(0,1fr)_370px]">
        {/* Desktop section rail */}
        <aside className="hidden lg:block">
          <nav aria-label="Menu sections" className="sticky top-[88px] py-8">
            <p className="eyebrow mb-4 text-gold-deep">The menu</p>
            <ul className="space-y-0.5">
              {sections.map(({ cat, items: list }) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => jumpTo(cat.id)}
                    aria-current={active === cat.id ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg py-2 pr-2 pl-3 text-left text-[15px] transition-colors",
                      active === cat.id ? "bg-white font-semibold text-espresso shadow-[inset_2px_0_0_var(--gold)] ring-1 ring-border" : "text-stone hover:text-espresso",
                    )}
                  >
                    {cat.name}
                    <span className="text-xs text-stone/80 tabular-nums">{list.length}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main id="menu" className={cn("min-w-0 pt-2 pb-32 lg:pt-4", count === 0 && "pb-16")}>
          {deferredQuery.trim() && (
            <p className="pt-4 text-sm text-stone" aria-live="polite">
              {resultCount} {resultCount === 1 ? "dish" : "dishes"}
            </p>
          )}
          {sections.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-20 text-center">
              <span className="mb-4 flex size-16 items-center justify-center rounded-full border border-gold/40 bg-accent">
                <Search className="size-6 text-gold-deep" />
              </span>
              <p className="font-display text-2xl font-semibold">Nothing matches “{deferredQuery.trim()}”</p>
              <p className="mt-1 text-sm text-stone">Try “ribeye”, “oysters” or “martini”.</p>
            </div>
          ) : (
            sections.map(({ cat, items: list }, si) => (
              <section
                key={cat.id}
                id={`cat-${cat.id}`}
                aria-labelledby={`cat-${cat.id}-title`}
                className={cn("scroll-mt-[124px] pt-9 lg:scroll-mt-[84px]", si > 1 && "cv-auto")}
              >
                <p className="eyebrow text-gold-deep">{String(categories.findIndex((c) => c.id === cat.id) + 1).padStart(2, "0")}</p>
                <h2 id={`cat-${cat.id}-title`} className="mt-1 font-display text-[2rem] leading-none font-semibold text-espresso">
                  {cat.name}
                </h2>
                {cat.blurb && <p className="mt-2 text-sm text-stone">{cat.blurb}</p>}
                <div className="gold-rule mt-4" />
                <div className="grid divide-y divide-border md:grid-cols-2 md:gap-x-10 md:divide-y-0 xl:grid-cols-1 xl:divide-y">
                  {list.map((item, i) => (
                    <div key={item.id} className="md:border-b md:border-border xl:border-b-0">
                      <MenuItemCard item={item} onOpen={openDish} priority={si === 0 && i < 2} />
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
          <MenuFooter />
        </main>

        {/* Desktop order panel */}
        <aside className="hidden xl:block">
          <div className="sticky top-[88px] my-8 flex max-h-[calc(100dvh-120px)] flex-col overflow-hidden rounded-3xl bg-card shadow-[0_24px_60px_-36px_rgba(30,26,23,.55)] ring-1 ring-border">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-2xl font-semibold">Your order</h2>
              <span className="eyebrow rounded-full bg-accent px-3 py-1.5 !text-[10px] text-gold-deep">{table ? `Table ${table}` : "Pickup / bar"}</span>
            </div>
            <CartContents variant="panel" />
          </div>
        </aside>
      </div>

      <CartBar onOpen={() => setCartOpen(true)} className="xl:hidden" />

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          side="bottom"
          className="flex max-h-[94dvh] flex-col gap-0 rounded-t-[1.75rem] border-0 p-0 sm:inset-x-auto! sm:inset-y-0! sm:right-0! sm:left-auto! sm:h-full! sm:max-h-none sm:w-[420px] sm:rounded-none sm:rounded-l-[1.75rem]"
        >
          <SheetHeader className="border-b border-border px-5 pt-6 pb-4">
            <SheetTitle className="font-display text-[1.75rem] leading-none font-semibold">Your order</SheetTitle>
            <p className="eyebrow mt-1 text-gold-deep">{table ? `Table ${table}` : "Pickup / bar"}</p>
          </SheetHeader>
          <CartContents variant="sheet" onPlaced={() => setCartOpen(false)} />
        </SheetContent>
      </Sheet>

      <ItemSheet item={openItem} onClose={() => setOpenItem(null)} />
    </div>
  );
}

function MenuFooter() {
  return (
    <footer className="mt-14 border-t border-border pt-6 text-sm text-stone">
      <p>{restaurant.address}</p>
      <p className="mt-1">
        <a href={restaurant.phoneHref} className="font-medium text-gold-deep underline-offset-4 hover:underline">
          {restaurant.phone}
        </a>{" "}
        · Prices exclude tax and gratuity · Consuming raw or undercooked meats, seafood or eggs may increase your risk of foodborne illness.
      </p>
      <p className="mt-4 text-xs">
        <Link href="/" className="underline-offset-4 hover:underline">
          cbdiner
        </Link>{" "}
        · Demo project by OVIOWEB
      </p>
    </footer>
  );
}
