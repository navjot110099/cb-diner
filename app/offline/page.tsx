import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { restaurant } from "@/lib/restaurant";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

/** Fallback page the service worker serves when a page isn't cached and there's no connection. */
export default function OfflinePage() {
  return (
    <div className="bg-night flex min-h-dvh flex-col items-center justify-center px-6 text-center text-ivory">
      <Logo tone="light" />
      <span className="mt-12 flex size-16 items-center justify-center rounded-full ring-1 ring-gold/40">
        <WifiOff className="size-7 text-gold-light" strokeWidth={1.5} />
      </span>
      <h1 className="mt-6 font-display text-5xl font-semibold">You’re offline</h1>
      <p className="mt-3 max-w-sm text-ivory/70">The menu you’ve already opened still works. To place an order, reconnect or ask your server.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/menu" className="bg-gold inline-flex h-12 items-center rounded-full px-6 font-semibold text-espresso">
          Open the saved menu
        </Link>
        <a href={restaurant.phoneHref} className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 font-semibold">
          Call {restaurant.phone}
        </a>
      </div>
    </div>
  );
}
