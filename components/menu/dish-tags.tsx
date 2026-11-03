import { Leaf, Sparkles, Star, Users } from "lucide-react";
import type { ItemTag } from "@/lib/types";
import { cn } from "@/lib/utils";

const TAGS: Partial<Record<ItemTag, { label: string; icon: typeof Star; className: string }>> = {
  signature: { label: "Signature", icon: Star, className: "text-gold-deep" },
  chef: { label: "Chef’s selection", icon: Sparkles, className: "text-rose-gold" },
  shareable: { label: "For the table", icon: Users, className: "text-espresso-soft" },
  seasonal: { label: "Seasonal", icon: Leaf, className: "text-sage" },
};

/** Signature / Chef’s selection / For the table / Seasonal / New. */
export function DishTags({ tags, className }: { tags: ItemTag[]; className?: string }) {
  const shown = tags.filter((t) => TAGS[t] || t === "new");
  if (!shown.length) return null;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
      {shown.map((t) => {
        if (t === "new") {
          return (
            <span key={t} className="eyebrow rounded-full bg-espresso px-2 py-0.5 !text-[9px] text-gold-light">
              New
            </span>
          );
        }
        const tag = TAGS[t]!;
        const Icon = tag.icon;
        return (
          <span key={t} className={cn("eyebrow inline-flex items-center gap-1 !text-[10px]", tag.className)}>
            <Icon className={cn("size-3", t === "signature" && "fill-current")} /> {tag.label}
          </span>
        );
      })}
    </span>
  );
}
