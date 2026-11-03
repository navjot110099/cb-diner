"use client";

import { useEffect, useState } from "react";
import { DAY_NAMES, formatSlots, localClock } from "@/lib/hours";
import { cn } from "@/lib/utils";

/** Weekly hours, Monday first, with today highlighted (New York time, computed in the browser). */
export function HoursList({ className }: { className?: string }) {
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => setToday(localClock().day), []);
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <dl className={cn("divide-y divide-border", className)}>
      {order.map((day) => (
        <div key={day} className={cn("flex items-baseline justify-between gap-4 py-2.5 text-[15px]", today === day && "font-semibold")}>
          <dt className="flex items-center gap-2">
            {DAY_NAMES[day]}
            {today === day && <span className="eyebrow rounded-full bg-espresso px-2 py-0.5 !text-[9px] text-gold-light">Today</span>}
          </dt>
          <dd className="text-right text-stone tabular-nums">{formatSlots(day)}</dd>
        </div>
      ))}
    </dl>
  );
}
