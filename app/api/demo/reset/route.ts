import { NextResponse } from "next/server";
import { getStaff } from "@/lib/auth";
import { resetDemoStore } from "@/lib/db/demo-repo";
import { isDemoMode } from "@/lib/env";

/** Demo mode only: restore the seeded menu and orders. */
export async function POST() {
  if (!isDemoMode) return NextResponse.json({ error: "Not available" }, { status: 404 });
  if (!(await getStaff())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  resetDemoStore();
  return NextResponse.json({ ok: true });
}
