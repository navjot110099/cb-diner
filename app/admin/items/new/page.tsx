import Link from "next/link";
import { ItemForm } from "@/components/admin/item-form";
import { repo } from "@/lib/db";

export default async function NewItemPage() {
  const categories = await repo.listCategories();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm font-medium text-gold-deep hover:underline">
          ← Menu
        </Link>
        <h1 className="mt-2 font-display text-5xl leading-none font-semibold">Add a dish</h1>
      </div>
      <ItemForm item={null} categories={categories} />
    </div>
  );
}
