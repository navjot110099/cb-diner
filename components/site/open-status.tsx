"use client";

import { useEffect, useState } from "react";
import { DAY_NAMES, formatTime, openStatus, type OpenStatus } from "@/lib/hours";
import { cn } from "@/lib/utils";

/** "Open now · Closes 10:30 pm". Computed in the browser (New York time) and refreshed every minute. */
export function OpenStatusBadge({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const [status, setStatus] = useState<OpenStatus | null>(null);

  useEffect(() => {
    const tick = () => setStatus(openStatus());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!status) return <span className={cn("inline-block h-8 w-48 rounded-full", tone === "light" ? "bg-linen" : "bg-white/8", className)} />;

  const label = status.open
    ? `${status.closingSoon ? "Last orders · closes" : "Closes"} ${formatTime(status.closesAt)}`
    : status.opensToday
      ? `Opens ${formatTime(status.opensAt)}`
      : `Opens ${DAY_NAMES[status.opensDay]} ${formatTime(status.opensAt)}`;

  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full px-3.5 text-[13px]",
        tone === "light" ? "bg-white text-espresso ring-1 ring-border" : "bg-white/8 text-ivory ring-1 ring-white/15 backdrop-blur",
        className,
      )}
    >
      <span className={cn("relative size-1.5 rounded-full", status.open ? "bg-[#4fae6a]" : "bg-rose-gold")}>
        {status.open && <span className="absolute inset-0 animate-ping rounded-full bg-[#4fae6a] opacity-60" />}
      </span>
      <span className="font-semibold">{status.open ? "Open now" : "Closed now"}</span>
      <span className={tone === "light" ? "text-stone" : "text-ivory/65"}>· {label}</span>
    </span>
  );
}
