"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { restaurant } from "@/lib/restaurant";

/**
 * Click-to-load Google Map. The iframe pulls ~1 MB of scripts, so cheap
 * phones only pay for it when the guest actually wants the map.
 */
export function MapCard() {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-espresso ring-1 ring-border sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[420px]">
      {loaded ? (
        <iframe
          title={`Map of ${restaurant.address}`}
          src={restaurant.maps.embedUrl}
          className="absolute inset-0 size-full border-0 grayscale-[35%] sepia-[12%]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setLoaded(true)} className="group absolute inset-0 flex flex-col items-center justify-center gap-4 text-ivory">
          {/* Street-grid sketch so the facade reads as a map before it loads. */}
          <svg className="absolute inset-0 size-full opacity-[.16]" aria-hidden="true">
            <defs>
              <pattern id="grid" width="56" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(29)">
                <path d="M0 0H56M0 0V40" stroke="#d9be8c" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <path d="M-20 260 C 140 220, 260 300, 520 180 S 900 140, 1200 220" stroke="#d9be8c" strokeWidth="10" fill="none" opacity=".55" />
          </svg>
          <span className="bg-gold relative flex size-14 items-center justify-center rounded-full text-espresso shadow-[0_0_0_10px_rgba(217,190,140,.15)] transition-transform group-hover:scale-105">
            <MapPin className="size-6" />
          </span>
          <span className="relative text-center">
            <span className="block font-display text-2xl font-semibold">{restaurant.addressLines[0]}</span>
            <span className="block text-sm text-ivory/70">{restaurant.addressLines[1]}</span>
          </span>
          <span className="eyebrow relative rounded-full border border-gold/50 px-4 py-2 text-gold-light group-hover:bg-white/5">Show map</span>
        </button>
      )}
    </div>
  );
}
