"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FoodImage } from "@/components/menu/food-image";
import { deleteItem, saveItem, type ItemFormState } from "@/app/admin/actions";
import type { Category, ItemTag, MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const TAG_OPTIONS: { value: ItemTag; label: string }[] = [
  { value: "signature", label: "Signature" },
  { value: "chef", label: "Chef’s selection" },
  { value: "shareable", label: "For the table" },
  { value: "new", label: "New" },
  { value: "seasonal", label: "Seasonal" },
  { value: "gf", label: "Gluten-free" },
  { value: "vegan", label: "Vegan" },
];

type Resized = { full: Blob; thumb: Blob; preview: string };

/** Center-crops to the given box and encodes WebP (JPEG where the browser can't encode WebP). */
async function resize(file: File): Promise<Resized> {
  const bitmap = await createImageBitmap(file);
  const encode = async (w: number, h: number, quality: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    const scale = Math.max(w / bitmap.width, h / bitmap.height);
    const sw = w / scale;
    const sh = h / scale;
    ctx.drawImage(bitmap, (bitmap.width - sw) / 2, (bitmap.height - sh) / 2, sw, sh, 0, 0, w, h);
    const webp = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
    if (webp?.type === "image/webp") return webp;
    return (await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality)))!;
  };
  const full = await encode(720, 540, 0.72);
  let thumb = await encode(288, 288, 0.7);
  if (thumb.type !== full.type) thumb = new Blob([await thumb.arrayBuffer()], { type: full.type });
  bitmap.close();
  return { full, thumb, preview: URL.createObjectURL(full) };
}

export function ItemForm({ item, categories }: { item: MenuItem | null; categories: Category[] }) {
  const [state, formAction, saving] = useActionState<ItemFormState, FormData>(saveItem, { error: null });
  const [, startTransition] = useTransition();
  const [photo, setPhoto] = useState<Resized | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const fe = state.fieldErrors ?? {};

  const preview = photo?.preview ?? (removePhoto ? null : item?.image?.full ?? null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith("image/")) return setPhotoError("Choose an image file (JPG, PNG, WebP or HEIC).");
    if (file.size > 25_000_000) return setPhotoError("That file is over 25 MB.");
    setProcessing(true);
    try {
      setPhoto(await resize(file));
      setRemovePhoto(false);
    } catch {
      setPhotoError("We couldn’t read that image. Try a JPG or PNG.");
    } finally {
      setProcessing(false);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.delete("file");
    if (photo) {
      const ext = photo.full.type === "image/webp" ? "webp" : "jpg";
      data.set("photoFull", new File([photo.full], `full.${ext}`, { type: photo.full.type }));
      data.set("photoThumb", new File([photo.thumb], `thumb.${ext}`, { type: photo.thumb.type }));
    }
    if (removePhoto) data.set("removePhoto", "1");
    startTransition(() => formAction(data));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="space-y-5 rounded-3xl bg-card p-6 ring-1 ring-border">
        <div className="grid gap-1.5">
          <Label htmlFor="name" className="eyebrow text-stone">Dish name</Label>
          <Input id="name" name="name" defaultValue={item?.name} required maxLength={80} aria-invalid={Boolean(fe.name)} className="h-11 rounded-xl bg-white text-[15px]" />
          {fe.name && <p className="text-sm text-destructive">{fe.name}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="description" className="eyebrow text-stone">Description</Label>
          <Textarea id="description" name="description" defaultValue={item?.description} maxLength={280} rows={3} className="rounded-xl bg-white text-[15px]" />
          <p className="text-xs text-stone">One or two lines: key ingredients and how it’s cooked.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="categoryId" className="eyebrow text-stone">Menu section</Label>
            <Select name="categoryId" defaultValue={item?.categoryId ?? categories[0]?.id}>
              <SelectTrigger id="categoryId" className="h-11 w-full rounded-xl bg-white text-[15px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="price" className="eyebrow text-stone">Price (USD)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-stone">$</span>
              <Input id="price" name="price" type="number" inputMode="numeric" min={1} max={5000} step={1} defaultValue={item?.price} required aria-invalid={Boolean(fe.price)} className="h-11 rounded-xl bg-white pl-7 text-[15px] tabular-nums" />
            </div>
            {fe.price && <p className="text-sm text-destructive">{fe.price}</p>}
          </div>
        </div>

        <fieldset className="grid gap-2">
          <legend className="eyebrow mb-1 text-stone">Labels</legend>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((t) => (
              <label key={t.value} className="cursor-pointer">
                <input type="checkbox" name="tags" value={t.value} defaultChecked={item?.tags.includes(t.value)} className="peer sr-only" />
                <span className="inline-flex h-9 items-center rounded-full bg-white px-3.5 text-sm ring-1 ring-border transition-colors peer-checked:bg-espresso peer-checked:text-gold-light peer-checked:ring-espresso peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-linen/70 px-4 py-3">
            <span>
              <span className="block font-semibold">Vegetarian</span>
              <span className="text-xs text-stone">Shows the V mark and the vegetarian filter</span>
            </span>
            <Switch name="isVeg" defaultChecked={item?.isVeg ?? false} className="data-[state=checked]:bg-sage" />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-linen/70 px-4 py-3">
            <span>
              <span className="block font-semibold">On the menu</span>
              <span className="text-xs text-stone">Off = “Sold out”, guests can’t order it</span>
            </span>
            <Switch name="isAvailable" defaultChecked={item?.isAvailable ?? true} className="data-[state=checked]:bg-sage" />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
          <p className="eyebrow mb-3 text-stone">Photo</p>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className={cn("group relative block w-full overflow-hidden rounded-2xl ring-1 ring-border", !preview && "border-2 border-dashed border-linen-deep ring-0")}
          >
            {preview ? (
              <FoodImage src={preview} alt="Dish photo preview" className="aspect-[4/3] w-full" />
            ) : (
              <span className="flex aspect-[4/3] flex-col items-center justify-center gap-2 text-stone">
                <ImagePlus className="size-7" strokeWidth={1.5} />
                <span className="text-sm font-medium">Upload a photo</span>
              </span>
            )}
            {processing && (
              <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loader2 className="size-6 animate-spin text-gold-deep" />
              </span>
            )}
          </button>
          <input ref={fileInput} type="file" name="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          <p className="mt-2 text-xs text-stone">Resized on your device to a small WebP before upload, so the menu stays fast on any phone.</p>
          {photoError && <p className="mt-2 text-sm text-destructive">{photoError}</p>}
          {preview && (
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
                setRemovePhoto(true);
              }}
              className="mt-2 text-sm font-medium text-stone underline-offset-4 hover:text-destructive hover:underline"
            >
              Remove photo
            </button>
          )}
        </div>

        {state.error && (
          <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving || processing} className="bg-gold h-12 flex-1 rounded-full text-[15px] font-semibold text-espresso hover:opacity-95">
            {saving && <Loader2 className="animate-spin" />} {item ? "Save changes" : "Add to menu"}
          </Button>
          <Link href="/admin" className="inline-flex h-12 items-center rounded-full px-5 text-sm font-semibold ring-1 ring-border hover:bg-linen">
            Cancel
          </Link>
        </div>

        {item && (
          <div className="rounded-3xl p-5 ring-1 ring-destructive/20">
            {confirmDelete ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="flex-1 text-sm">Delete “{item.name}” for good?</p>
                <Button type="button" variant="destructive" disabled={deleting} onClick={() => startDelete(() => deleteItem(item.id))}>
                  {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete
                </Button>
                <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Keep
                </Button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 text-sm font-semibold text-destructive">
                <Trash2 className="size-4" /> Delete this dish
              </button>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
