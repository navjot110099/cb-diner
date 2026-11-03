/**
 * Public origin of the app (used for table QR codes, metadata and sitemaps).
 * Prefers NEXT_PUBLIC_SITE_URL, then Vercel's production domain, then localhost.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");
