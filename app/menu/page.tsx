import type { Metadata } from "next";
import { MenuApp } from "@/components/menu/menu-app";
import { repo } from "@/lib/db";
import { isValidTable } from "@/lib/restaurant";

export const metadata: Metadata = {
  title: "Menu",
  description: "Order at your table: thalis, dal baati churma, laal maas, tandoor, dosa, desserts and kulhad chai. Hindi and English, prices in ₹ with GST.",
  alternates: { canonical: "/menu" },
};

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ table?: string }> }) {
  const [{ table }, categories, items] = await Promise.all([searchParams, repo.listCategories(), repo.listItems()]);
  return <MenuApp categories={categories} items={items} initialTable={isValidTable(table) ? table : null} />;
}
