import { NextResponse } from "next/server";
import { getStaff } from "@/lib/auth";
import { repo } from "@/lib/db";
import { isDemoMode } from "@/lib/env";
import { restaurant } from "@/lib/restaurant";

const NOTES = [null, null, "Steak medium-rare please", "Nut allergy at the table", "Sauce on the side", "Birthday — candle on dessert", null];
const NAMES = [null, null, "Olivia", "James", "Sophia", null];

/** Demo mode only: drops a random guest order into the kitchen feed. */
export async function POST() {
  if (!isDemoMode) return NextResponse.json({ error: "Not available" }, { status: 404 });
  if (!(await getStaff())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const menu = (await repo.listItems()).filter((i) => i.isAvailable);
  const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
  const count = 2 + Math.floor(Math.random() * 3);
  const lines = Array.from({ length: count }, () => ({ itemId: pick(menu).id, qty: 1 + Math.floor(Math.random() * 2) }));
  const takeaway = Math.random() < 0.15;

  const order = await repo.createOrder({
    table: takeaway ? null : String(1 + Math.floor(Math.random() * restaurant.tableCount)),
    customerName: pick(NAMES),
    note: pick(NOTES),
    lines,
  });
  return NextResponse.json({ order }, { status: 201 });
}
