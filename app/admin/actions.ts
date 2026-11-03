"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { repo } from "@/lib/db";
import { ITEM_TAGS, type MenuItemInput } from "@/lib/types";

function refresh() {
  revalidatePath("/menu");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function setAvailability(id: string, isAvailable: boolean) {
  await requireAdmin();
  await repo.setAvailability(id, isAvailable);
  refresh();
}

const itemSchema = z.object({
  name: z.string().trim().min(2, "Give the dish a name").max(80),
  description: z.string().trim().max(280),
  categoryId: z.string().min(1, "Pick a section"),
  price: z.coerce.number().int("Whole dollars only").min(1, "Price must be at least $1").max(5000),
  isVeg: z.boolean(),
  isAvailable: z.boolean(),
  tags: z.array(z.enum(ITEM_TAGS)),
});

export type ItemFormState = { error: string | null; fieldErrors?: Record<string, string> };

const MAX_PHOTO_BYTES = 1_500_000;

/** Creates or updates a dish. Photos arrive already resized to WebP by the browser. */
export async function saveItem(_prev: ItemFormState, formData: FormData): Promise<ItemFormState> {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    categoryId: formData.get("categoryId"),
    price: formData.get("price"),
    isVeg: formData.get("isVeg") === "on",
    isAvailable: formData.get("isAvailable") === "on",
    tags: formData.getAll("tags"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const categories = await repo.listCategories();
  if (!categories.some((c) => c.id === parsed.data.categoryId)) return { error: "Unknown menu section." };

  const existing = id ? await repo.getItem(id) : null;
  if (id && !existing) return { error: "This dish no longer exists." };

  let image = existing?.image ?? null;
  if (formData.get("removePhoto") === "1") image = null;
  const full = formData.get("photoFull");
  const thumb = formData.get("photoThumb");
  if (full instanceof File && full.size > 0 && thumb instanceof File && thumb.size > 0) {
    const type = full.type;
    if ((type !== "image/webp" && type !== "image/jpeg") || thumb.type !== type) return { error: "Photos must be uploaded through the form." };
    if (full.size > MAX_PHOTO_BYTES || thumb.size > MAX_PHOTO_BYTES) return { error: "That photo is too large." };
    image = await repo.uploadPhoto(parsed.data.name, new Uint8Array(await full.arrayBuffer()), new Uint8Array(await thumb.arrayBuffer()), type);
  }

  const input: MenuItemInput = { ...parsed.data, image };
  if (existing) await repo.updateItem(existing.id, input);
  else await repo.createItem(input);
  refresh();
  redirect(`/admin?saved=${encodeURIComponent(parsed.data.name)}`);
}

export async function deleteItem(id: string) {
  await requireAdmin();
  await repo.deleteItem(id);
  refresh();
  redirect("/admin?deleted=1");
}
