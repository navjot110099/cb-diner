import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemForm } from "@/components/admin/item-form";
import { repo } from "@/lib/db";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, categories] = await Promise.all([repo.getItem(id), repo.listCategories()]);
  if (!item) notFound();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm font-medium text-gold-deep hover:underline">
          ← Menu
        </Link>
        <h1 className="mt-2 font-display text-5xl leading-none font-semibold">{item.name}</h1>
      </div>
      <ItemForm key={item.id} item={item} categories={categories} />
    </div>
  );
}
