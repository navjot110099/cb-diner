/**
 * Public restaurant details shown to guests. Contact numbers, the map and the
 * Google review link come from NEXT_PUBLIC_* variables so the owner can change
 * them on Vercel without touching code. The defaults are demo placeholders
 * (555-01xx numbers are reserved for fiction in North America).
 */
const env = {
  phone: process.env.NEXT_PUBLIC_RESTAURANT_PHONE || "(212) 555-0147",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "12125550147",
  mapsQuery: process.env.NEXT_PUBLIC_MAPS_QUERY || "Park Avenue South, New York, NY",
  mapsEmbedKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY || "",
  placeId: process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || "",
  tableCount: Number(process.env.NEXT_PUBLIC_TABLE_COUNT || 24),
};

export type DayHours = { open: string; close: string }[];

export const restaurant = {
  name: "CB Diner",
  tagline: "Prime steaks · Raw bar · Cocktails",
  city: "New York",
  address: "240 Park Avenue South, New York, NY 10003",
  addressLines: ["240 Park Avenue South", "New York, NY 10003"],
  phone: env.phone,
  phoneHref: `tel:+1${env.phone.replace(/\D/g, "").replace(/^1/, "")}`,
  whatsapp: env.whatsapp.replace(/\D/g, ""),
  email: "reservations@cbdiner.example",
  since: 1987,
  rating: 4.8,
  reviewCount: 2316,
  tableCount: Number.isFinite(env.tableCount) && env.tableCount > 0 ? Math.min(env.tableCount, 99) : 24,
  timeZone: "America/New_York",
  /** Shown under the cart total; tax is added on the final check. */
  taxNote: "NYC sales tax (8.875%) and gratuity are added to your check.",
  /**
   * Weekly hours in 24h local time, Sunday first (matches Date.getDay()).
   * Lunch and dinner service on weekdays, brunch then dinner on Sunday.
   */
  hours: [
    [{ open: "11:00", close: "15:00" }, { open: "17:00", close: "22:00" }],
    [{ open: "17:00", close: "22:00" }],
    [{ open: "11:30", close: "14:30" }, { open: "17:00", close: "22:30" }],
    [{ open: "11:30", close: "14:30" }, { open: "17:00", close: "22:30" }],
    [{ open: "11:30", close: "14:30" }, { open: "17:00", close: "22:30" }],
    [{ open: "11:30", close: "14:30" }, { open: "17:00", close: "23:30" }],
    [{ open: "17:00", close: "23:30" }],
  ] satisfies DayHours[],
  maps: {
    query: env.mapsQuery,
    /** Keyless embed by default; the Maps Embed API is used when a key is set. */
    embedUrl: env.mapsEmbedKey
      ? `https://www.google.com/maps/embed/v1/place?key=${env.mapsEmbedKey}&q=${encodeURIComponent(env.mapsQuery)}&zoom=15`
      : `https://www.google.com/maps?q=${encodeURIComponent(env.mapsQuery)}&z=15&output=embed`,
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(env.mapsQuery)}`,
  },
  reviewUrl: env.placeId
    ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(env.placeId)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`CB Diner ${env.mapsQuery}`)}`,
};

export function isValidTable(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{1,2}$/.test(value)) return false;
  const n = Number(value);
  return n >= 1 && n <= restaurant.tableCount;
}
