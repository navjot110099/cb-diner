import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderTracker } from "@/components/order/order-tracker";
import { repo } from "@/lib/db";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ placed?: string }> }) {
  const [{ id }, { placed }] = await Promise.all([params, searchParams]);
  const order = await repo.getOrder(id);
  if (!order) notFound();
  return <OrderTracker initial={{ ...order, customerName: null }} justPlaced={placed === "1"} />;
}
