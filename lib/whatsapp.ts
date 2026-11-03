import { dollars } from "@/lib/format";
import { restaurant } from "@/lib/restaurant";

type Line = { name: string; qty: number; price: number };

/** Builds a wa.me link with the order pre-filled. */
export function whatsappOrderLink(opts: { lines: Line[]; table: string | null; number?: number; note?: string | null; name?: string | null }) {
  const total = opts.lines.reduce((s, l) => s + l.price * l.qty, 0);
  const rows = [
    "*New order — CB Diner*",
    opts.table ? `Table: ${opts.table}` : "Pickup / bar",
    opts.number ? `Order: #${opts.number}` : null,
    "",
    ...opts.lines.map((l) => `${l.qty} × ${l.name} — ${dollars(l.price * l.qty)}`),
    "",
    `*Subtotal: ${dollars(total)}*`,
    opts.note ? `Note: ${opts.note}` : null,
    opts.name ? `Name: ${opts.name}` : null,
  ].filter((r) => r !== null);
  return `https://wa.me/${restaurant.whatsapp}?text=${encodeURIComponent(rows.join("\n"))}`;
}
