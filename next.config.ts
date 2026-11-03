import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Dish photos are resized in the browser, but give uploads some headroom (Vercel caps bodies at 4.5 MB).
    serverActions: { bodySizeLimit: "4mb" },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Hashed by content, safe to cache for a year.
      { source: "/food/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }] },
      { source: "/img/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }] },
    ];
  },
};

export default nextConfig;
