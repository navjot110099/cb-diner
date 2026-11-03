import { cn } from "@/lib/utils";

/** "CB" monogram inside a thin double gold ring. */
export function LogoMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center rounded-full font-display text-[15px] font-semibold tracking-[0.04em]",
        tone === "dark" ? "bg-espresso text-gold-light" : "bg-white/6 text-gold-light",
        className,
      )}
    >
      <span className="absolute inset-[2px] rounded-full border border-gold/70" />
      <span className="absolute inset-[5px] rounded-full border border-gold/25" />
      <span className="relative translate-y-px">CB</span>
    </span>
  );
}

export function Logo({ className, tone = "dark", sub = "New York · Est. 1987" }: { className?: string; tone?: "dark" | "light"; sub?: string | null }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark tone={tone} />
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-[1.45rem] font-semibold tracking-[0.02em]", tone === "light" ? "text-ivory" : "text-espresso")}>CB Diner</span>
        {sub && <span className={cn("eyebrow mt-1 !text-[9.5px] !tracking-[0.26em]", tone === "light" ? "text-gold-light/85" : "text-gold-deep")}>{sub}</span>}
      </span>
    </span>
  );
}
