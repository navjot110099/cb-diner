import Link from "next/link";
import { Plus } from "lucide-react";
import { MenuManager } from "@/components/admin/menu-manager";
import { SavedToast } from "@/components/admin/saved-toast";
import { now } from "@/lib/clock";
import { repo } from "@/lib/db";
import { clockTime, dollars } from "@/lib/format";
import { localClock } from "@/lib/hours";
import { cn } from "@/lib/utils";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const { saved, deleted } = await searchParams;
  const midnight = new Date(now() - localClock().minutes * 60_000);
  const [categories, items, orders] = await Promise.all([repo.listCategories(), repo.listItems(), repo.listOrders(midnight)]);

  const billable = orders.filter((o) => o.status !== "cancelled");
  const revenue = billable.reduce((s, o) => s + o.total, 0);
  const soldOut = items.filter((i) => !i.isAvailable).length;
  const open = orders.filter((o) => o.status === "new" || o.status === "preparing").length;

  const stats = [
    { label: "Orders today", value: String(billable.length), hint: `${open} open in the kitchen` },
    { label: "Sales today", value: dollars(revenue), hint: "Before tax & gratuity" },
    { label: "Average check", value: billable.length ? dollars(Math.round(revenue / billable.length)) : "—", hint: "Per table order" },
    { label: "Sold out", value: String(soldOut), hint: soldOut === 1 ? "dish hidden from ordering" : "dishes hidden from ordering" },
  ];

  return (
    <div className="space-y-10">
      <SavedToast saved={saved} deleted={deleted === "1"} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-gold-deep">Tonight at CB Diner</p>
          <h1 className="mt-2 font-display text-5xl leading-none font-semibold">Menu & service</h1>
        </div>
        <Link href="/admin/items/new" className="bg-gold inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-espresso hover:opacity-95">
          <Plus className="size-4" /> Add a dish
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <dt className="eyebrow text-stone">{s.label}</dt>
            <dd className="mt-2 font-display text-4xl leading-none font-semibold tabular-nums">{s.value}</dd>
            <p className="mt-2 text-xs text-stone">{s.hint}</p>
          </div>
        ))}
      </dl>

      <section className="rounded-3xl bg-card ring-1 ring-border">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-2xl font-semibold">Latest orders</h2>
          <Link href="/kitchen" className="text-sm font-semibold text-gold-deep hover:underline">
            Open kitchen screen →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-stone">
                <th className="eyebrow px-5 py-3 font-semibold">Order</th>
                <th className="eyebrow px-3 py-3 font-semibold">Table</th>
                <th className="eyebrow px-3 py-3 font-semibold">Items</th>
                <th className="eyebrow px-3 py-3 font-semibold">Placed</th>
                <th className="eyebrow px-3 py-3 font-semibold">Status</th>
                <th className="eyebrow px-5 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.slice(0, 6).map((o) => (
                <tr key={o.id}>
                  <td className="px-5 py-3 font-semibold whitespace-nowrap">
                    #{o.number}
                  </td>
                  <td className="px-3 py-3">{o.table ?? "Pickup"}</td>
                  <td className="max-w-[240px] truncate px-3 py-3 text-stone">{o.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}</td>
                  <td className="px-3 py-3 text-stone tabular-nums">{clockTime(o.createdAt)}</td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "eyebrow rounded-full px-2.5 py-1 !text-[9.5px]",
                        o.status === "new" && "bg-gold-light/40 text-gold-deep",
                        o.status === "preparing" && "bg-rose-gold/15 text-rose-deep",
                        o.status === "served" && "bg-sage/15 text-sage-deep",
                        o.status === "cancelled" && "bg-linen text-stone line-through",
                      )}
                    >
                      {o.status === "preparing" ? "Firing" : o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">{dollars(o.total)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-stone">
                    No orders yet today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <MenuManager categories={categories} items={items} />
    </div>
  );
}
