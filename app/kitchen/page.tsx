import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { KitchenBoard } from "@/components/kitchen/kitchen-board";
import { requireStaff } from "@/lib/auth";
import { now } from "@/lib/clock";
import { repo } from "@/lib/db";
import { env, isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Kitchen", robots: { index: false } };

export default async function KitchenPage() {
  const staff = await requireStaff("/kitchen");
  const orders = await repo.listOrders(new Date(now() - 12 * 3600_000));
  return (
    <>
      <KitchenBoard
        initial={orders}
        staff={staff}
        mode={isDemoMode ? { kind: "polling" } : { kind: "realtime", url: env.supabaseUrl, anonKey: env.supabaseAnonKey }}
      />
      <Toaster position="bottom-right" />
    </>
  );
}
