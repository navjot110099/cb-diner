import { now as clockNow } from "@/lib/clock";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** $1,249 — fine-dining menus list whole dollars. */
export function dollars(amount: number) {
  return usd.format(amount);
}

/** "5 min", "1 hr 12 min" — used on kitchen tickets. */
export function elapsed(fromIso: string, now = clockNow()) {
  const mins = Math.max(0, Math.floor((now - new Date(fromIso).getTime()) / 60000));
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} hr ${mins % 60} min`;
}

export function clockTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })
    .format(new Date(iso))
    .toLowerCase()
    .replace(/[  ]/g, " ");
}
