import Link from "next/link";
import { ArrowRight, Phone, QrCode, ScanLine, Smartphone, Star } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { DietMarks } from "@/components/menu/diet-marks";
import { InstallCard } from "@/components/pwa/install-card";
import { HoursList } from "@/components/site/hours-list";
import { WhatsAppIcon } from "@/components/site/icons";
import { MapCard } from "@/components/site/map-card";
import { OpenStatusBadge } from "@/components/site/open-status";
import { SiteFooter } from "@/components/site/site-footer";
import { repo } from "@/lib/db";
import { SIGNATURE_IDS } from "@/lib/demo/seed";
import { dollars } from "@/lib/format";
import { restaurant } from "@/lib/restaurant";
import { siteUrl } from "@/lib/site-url";

export const revalidate = 300;

const STEPS = [
  { icon: ScanLine, title: "Scan the code on your table", body: "The menu opens on your phone with your table number already set — no app, no sign-up." },
  { icon: Smartphone, title: "Choose at your own pace", body: "Photos, dietary marks and notes for the kitchen: steak temperature, allergies, sauce on the side." },
  { icon: QrCode, title: "We fire it right away", body: "Your order lands on the kitchen screen instantly. Follow it from received to served, or send it on WhatsApp." },
];

export default async function HomePage() {
  const items = await repo.listItems();
  const signature = SIGNATURE_IDS.map((id) => items.find((i) => i.id === id)).filter((i) => i !== undefined);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "CB Diner",
    url: siteUrl,
    image: `${siteUrl}/img/hero-dining.webp`,
    telephone: restaurant.phone,
    servesCuisine: ["American", "Steakhouse", "Seafood"],
    priceRange: "$$$$",
    menu: `${siteUrl}/menu`,
    acceptsReservations: true,
    address: { "@type": "PostalAddress", streetAddress: "240 Park Avenue South", addressLocality: "New York", addressRegion: "NY", postalCode: "10003", addressCountry: "US" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: restaurant.rating, reviewCount: restaurant.reviewCount },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <header className="relative isolate overflow-hidden bg-espresso text-ivory">
        <picture>
          <source media="(min-width: 768px)" srcSet="/img/hero-dining.webp" />
          { }
          <img src="/img/hero-dining-sm.webp" alt="The CB Diner dining room at night" fetchPriority="high" className="absolute inset-0 -z-20 size-full object-cover" />
        </picture>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(20,17,16,.55)_0%,rgba(20,17,16,.35)_35%,rgba(20,17,16,.92)_100%)] md:bg-[linear-gradient(95deg,rgba(20,17,16,.95)_0%,rgba(20,17,16,.75)_45%,rgba(20,17,16,.2)_100%)]" />
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" aria-label="CB Diner home">
            <Logo tone="light" />
          </Link>
          <div className="flex items-center gap-1 text-sm sm:gap-2">
            <Link href="/menu" className="hidden rounded-full px-4 py-2 text-ivory/80 hover:text-ivory sm:inline-block">
              Menu
            </Link>
            <a href="#story" className="hidden rounded-full px-4 py-2 text-ivory/80 hover:text-ivory md:inline-block">
              Our story
            </a>
            <a href="#visit" className="hidden rounded-full px-4 py-2 text-ivory/80 hover:text-ivory md:inline-block">
              Visit
            </a>
            <a href={restaurant.phoneHref} className="inline-flex h-10 items-center gap-2 rounded-full border border-gold/50 px-4 font-medium text-gold-light hover:bg-white/5">
              <Phone className="size-4" /> <span className="hidden sm:inline">Reserve</span> <span className="sm:hidden">Call</span>
            </a>
          </div>
        </nav>

        <div className="mx-auto flex min-h-[78svh] max-w-7xl flex-col justify-end px-5 pt-24 pb-14 sm:px-8 md:min-h-[82vh] md:justify-center md:pb-24">
          <p className="eyebrow text-gold-light">Park Avenue South · Since {restaurant.since}</p>
          <h1 className="mt-4 max-w-3xl font-display text-[3.2rem] leading-[0.95] font-semibold sm:text-7xl lg:text-[5.6rem]">
            An American <em className="text-gold-gradient font-medium">grand</em> dining room.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ivory/75">
            Dry-aged USDA Prime, Maine lobster and a raw bar on crushed ice — served with old New York polish.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/menu" className="bg-gold inline-flex h-13 items-center gap-2 rounded-full px-7 text-[15px] font-semibold text-espresso shadow-[0_18px_36px_-18px_rgba(217,190,140,.8)] hover:opacity-95">
              View the menu <ArrowRight className="size-4" />
            </Link>
            <a href={restaurant.phoneHref} className="inline-flex h-13 items-center gap-2 rounded-full border border-white/25 px-7 text-[15px] font-semibold hover:bg-white/5">
              Call to reserve
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <OpenStatusBadge tone="dark" />
            <a href={restaurant.reviewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/8 px-3.5 text-[13px] ring-1 ring-white/15 hover:bg-white/12">
              <Star className="size-3.5 fill-gold-light text-gold-light" />
              <span className="font-semibold">{restaurant.rating}</span>
              <span className="text-ivory/65">· {restaurant.reviewCount.toLocaleString("en-US")} Google reviews</span>
            </a>
          </div>
        </div>
        <span className="bg-gold absolute inset-x-0 bottom-0 h-px opacity-70" aria-hidden="true" />
      </header>

      <main>
        {/* Signature dishes */}
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-gold-deep">From the kitchen</p>
              <h2 className="mt-3 font-display text-5xl leading-none font-semibold md:text-6xl">The house signatures</h2>
            </div>
            <Link href="/menu" className="group inline-flex items-center gap-2 text-[15px] font-semibold text-gold-deep">
              Full menu <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="gold-rule mt-8" />
          <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {signature.map((item) => (
              <li key={item.id}>
                <Link href={`/menu#dish-${item.id}`} className="group block">
                  <div className="overflow-hidden rounded-[1.75rem] bg-linen ring-1 ring-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image?.full}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="mt-5 flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-[1.6rem] leading-tight font-semibold">{item.name}</h3>
                    <span className="font-semibold tabular-nums text-gold-deep">{dollars(item.price)}</span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-stone">{item.description}</p>
                  <DietMarks isVeg={item.isVeg} tags={item.tags} className="mt-2" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Table ordering */}
        <section className="bg-night relative overflow-hidden text-ivory">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <div>
              <p className="eyebrow text-gold-light">Table ordering</p>
              <h2 className="mt-3 font-display text-5xl leading-[0.98] font-semibold md:text-6xl">
                Scan. Choose. <em className="text-gold-gradient font-medium">Relax.</em>
              </h2>
              <p className="mt-5 max-w-md text-ivory/70">
                Every table has its own QR code. Order a second round or dessert the moment you want it — your server still looks after you,
                just without the wait.
              </p>
              <Link href="/menu?table=5" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full border border-gold/50 px-6 font-semibold text-gold-light hover:bg-white/5">
                Try it as Table 5 <ArrowRight className="size-4" />
              </Link>
            </div>
            <ol className="grid gap-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-5 rounded-3xl bg-white/[.04] p-6 ring-1 ring-white/10">
                  <span className="font-display text-5xl leading-none font-semibold text-gold-gradient">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="flex items-center gap-2 text-lg font-semibold">
                      <step.icon className="size-5 text-gold-light" strokeWidth={1.75} /> {step.title}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ivory/65">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Story */}
        <section id="story" className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-2 lg:items-center">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/dining-room.webp" alt="Set tables in the CB Diner dining room" loading="lazy" decoding="async" className="aspect-[5/4] w-full rounded-[2rem] object-cover ring-1 ring-border" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/chef-sm.webp"
              alt="A chef plating a dish"
              loading="lazy"
              decoding="async"
              className="absolute -bottom-8 -left-2 hidden aspect-[6/7] w-44 rounded-[1.5rem] object-cover shadow-[0_24px_50px_-24px_rgba(30,26,23,.7)] ring-4 ring-ivory sm:block lg:-left-8 lg:w-52"
            />
          </div>
          <div className="lg:pl-8">
            <p className="eyebrow text-gold-deep">Our story</p>
            <h2 className="mt-3 font-display text-5xl leading-[0.98] font-semibold md:text-6xl">Thirty-nine years on Park Avenue South</h2>
            <p className="mt-6 text-[17px] leading-relaxed text-stone">
              CB Diner opened in {restaurant.since} as a twelve-booth chophouse. Today it is a white-tablecloth dining room with the same promise:
              the best beef we can buy, aged in our own cellar, and a welcome that makes regulars of first-timers.
            </p>
            <p className="mt-4 text-[17px] leading-relaxed text-stone">Our raw bar is stocked twice a day, the cellar holds 400 labels, and the martinis are still stirred.</p>
            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-8">
              {[
                ["28", "days of dry-aging"],
                ["400", "wines in the cellar"],
                [String(restaurant.since), "the year we opened"],
              ].map(([n, label]) => (
                <div key={label}>
                  <dt className="font-display text-4xl font-semibold text-gold-deep">{n}</dt>
                  <dd className="mt-1 text-sm text-stone">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Visit */}
        <section id="visit" className="border-t border-border bg-linen/60">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-2">
            <div>
              <p className="eyebrow text-gold-deep">Visit us</p>
              <h2 className="mt-3 font-display text-5xl leading-none font-semibold md:text-6xl">Reservations & hours</h2>
              <div className="mt-8 rounded-3xl bg-card p-6 ring-1 ring-border sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="eyebrow text-stone">Opening hours</h3>
                  <OpenStatusBadge />
                </div>
                <HoursList className="mt-3" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <a href={restaurant.phoneHref} className="flex h-12 items-center justify-center gap-2 rounded-full bg-espresso font-semibold text-ivory hover:bg-espresso-soft">
                  <Phone className="size-4 text-gold-light" /> Call
                </a>
                <a
                  href={`https://wa.me/${restaurant.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-white font-semibold ring-1 ring-border hover:bg-linen"
                >
                  <WhatsAppIcon className="size-5 text-[#25a35a]" /> WhatsApp
                </a>
                <a
                  href={restaurant.maps.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-white font-semibold ring-1 ring-border hover:bg-linen"
                >
                  Directions
                </a>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-card p-6 ring-1 ring-border">
                <div>
                  <p className="flex items-center gap-1 text-gold" aria-label={`${restaurant.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold">Dined with us?</p>
                  <p className="text-sm text-stone">A short Google review means the world to our team.</p>
                </div>
                <a href={restaurant.reviewUrl} target="_blank" rel="noopener noreferrer" className="bg-gold inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold text-espresso hover:opacity-95">
                  Write a review
                </a>
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <MapCard />
              <InstallCard dismissible={false} />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
