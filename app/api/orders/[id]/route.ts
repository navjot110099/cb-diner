import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaff } from "@/lib/auth";
import { NotFoundError, repo } from "@/lib/db";
import { ORDER_STATUSES } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

/** Guest status page polls this. Order ids are random UUIDs, so they act as the access key. */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const order = await repo.getOrder(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Guest names stay with staff; the status page doesn't need them.
  return NextResponse.json({ order: { ...order, customerName: null } }, { headers: { "Cache-Control": "no-store" } });
}

const patchSchema = z.object({ status: z.enum(ORDER_STATUSES) });

export async function PATCH(request: Request, { params }: Params) {
  if (!(await getStaff())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  try {
    const { id } = await params;
    const order = await repo.updateOrderStatus(id, parsed.data.status);
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof NotFoundError) return NextResponse.json({ error: "Not found" }, { status: 404 });
    throw error;
  }
}
