import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaff } from "@/lib/auth";
import { now } from "@/lib/clock";
import { repo, UnavailableError } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isValidTable } from "@/lib/restaurant";

const orderSchema = z.object({
  table: z.string().trim().nullable().optional(),
  customerName: z.string().trim().max(40).nullable().optional(),
  note: z.string().trim().max(240).nullable().optional(),
  lines: z
    .array(z.object({ itemId: z.string().min(1).max(80), qty: z.number().int().min(1).max(20) }))
    .min(1)
    .max(40),
});

/** Guests place orders here. Prices are recomputed from the menu on the server. */
export async function POST(request: Request) {
  const limit = rateLimit(`order:${await clientIp()}`, 10, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many orders. Please ask a server." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  }

  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order" }, { status: 400 });

  const { table, customerName, note, lines } = parsed.data;
  if (table && !isValidTable(table)) return NextResponse.json({ error: "Unknown table" }, { status: 400 });

  try {
    const order = await repo.createOrder({
      table: table || null,
      customerName: customerName || null,
      note: note || null,
      lines,
    });
    return NextResponse.json({ order: { id: order.id, number: order.number } }, { status: 201 });
  } catch (error) {
    if (error instanceof UnavailableError) {
      return NextResponse.json({ error: "unavailable", itemIds: error.itemIds }, { status: 409 });
    }
    console.error("createOrder failed", error);
    return NextResponse.json({ error: "Could not place the order" }, { status: 500 });
  }
}

/** Kitchen feed: orders from the last 12 hours. Staff only. */
export async function GET() {
  if (!(await getStaff())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = await repo.listOrders(new Date(now() - 12 * 3600_000));
  return NextResponse.json({ orders }, { headers: { "Cache-Control": "no-store" } });
}
