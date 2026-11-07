import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { restaurant } from "@/lib/restaurant";

export function SiteFooter() {
  return (
    <footer className="bg-night text-ivory/75">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed">
            Prime steaks, a raw bar on ice and classic cocktails on Park Avenue South since {restaurant.since}.
          </p>
        </div>
        <div className="text-sm">
          <p className="eyebrow mb-3 text-gold-light">Visit</p>
          <p>{restaurant.addressLines[0]}</p>
          <p>{restaurant.addressLines[1]}</p>
          <a href={restaurant.phoneHref} className="mt-3 inline-block text-ivory underline-offset-4 hover:underline">
            {restaurant.phone}
          </a>
        </div>
        <div className="text-sm">
          <p className="eyebrow mb-3 text-gold-light">Explore</p>
          <ul className="space-y-2">
            <li>
              <Link href="/menu" className="hover:text-ivory">
                Menu & table ordering
              </Link>
            </li>
            <li>
              <a href={restaurant.reviewUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ivory">
                Review us on Google
              </a>
            </li>
            <li>
              <Link href="/staff/login" className="hover:text-ivory">
                Staff login
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-ivory/50 sm:px-8">
          <p>© {new Date().getFullYear()} CB Diner · Prices exclude tax and gratuity</p>
          <p>Website by OVIOWEB</p>
        </div>
      </div>
    </footer>
  );
}
