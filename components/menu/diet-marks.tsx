import type { ItemTag } from "@/lib/types";

/** Dietary marks are for food; on cocktails and wine they only add noise. */
export const NO_DIET_MARKS = new Set(["bar"]);
import { cn } from "@/lib/utils";

const MARKS = [
  { key: "v", label: "Vegetarian", short: "V", className: "border-sage/50 text-sage" },
  { key: "vegan", label: "Vegan", short: "VG", className: "border-sage/50 text-sage" },
  { key: "gf", label: "Gluten-free", short: "GF", className: "border-stone/40 text-stone" },
] as const;

/** US-menu dietary marks: V (vegetarian), VG (vegan), GF (gluten-free). */
export function DietMarks({ isVeg, tags, className }: { isVeg: boolean; tags: ItemTag[]; className?: string }) {
  const shown = MARKS.filter((m) => (m.key === "v" ? isVeg && !tags.includes("vegan") : tags.includes(m.key)));
  if (!shown.length) return null;
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {shown.map((m) => (
        <abbr
          key={m.key}
          title={m.label}
          aria-label={m.label}
          className={cn("inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border px-1 text-[9.5px] font-bold tracking-wide no-underline", m.className)}
        >
          {m.short}
        </abbr>
      ))}
    </span>
  );
}
