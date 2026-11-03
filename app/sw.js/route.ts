/**
 * Service worker, served from the site root so its scope covers every page.
 * It's a route (not a file in /public) so each build gets a new cache version
 * and old caches are cleaned up on activate.
 *
 * Strategy:
 * - Guest pages (/, /menu, /order/*): network first with a 4 s timeout, then
 *   the cached copy, then /offline. /menu is cached once for every table —
 *   the table number is read from the URL in the browser.
 * - Hashed Next.js assets: cache first (they never change).
 * - Dish photos, icons, fonts: stale-while-revalidate, capped at 180 entries.
 * - /api, /kitchen, /admin and /staff always go to the network.
 */
export const dynamic = "force-static";

const VERSION = (process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString(36)).slice(0, 10);

const source = /* js */ `
const VERSION = ${JSON.stringify(VERSION)};
const PAGES = "cb-pages-" + VERSION;
const STATIC = "cb-static-" + VERSION;
const MEDIA = "cb-media-v1";
const OFFLINE_URL = "/offline";
const PRECACHE = ["/menu", "/", OFFLINE_URL, "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];
const PUBLIC_PAGE = /^\\/(menu|offline|order\\/[\\w-]+)?$/;
const NETWORK_ONLY = /^\\/(api|kitchen|admin|staff)(\\/|$)/;
const MEDIA_LIMIT = 180;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PAGES);
    await Promise.all(PRECACHE.map(async (url) => {
      try {
        const res = await fetch(url, { cache: "reload", credentials: "same-origin" });
        if (res.ok) await cache.put(url, res);
      } catch {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set([PAGES, STATIC, MEDIA]);
    for (const key of await caches.keys()) if (key.startsWith("cb-") && !keep.has(key)) await caches.delete(key);
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

// The page hands over the assets it already loaded before the worker took control.
self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "CACHE_URLS") return;
  event.waitUntil((async () => {
    const statics = await caches.open(STATIC);
    const media = await caches.open(MEDIA);
    for (const href of event.data.urls || []) {
      try {
        const url = new URL(href);
        if (url.origin !== self.location.origin) continue;
        const cache = url.pathname.startsWith("/_next/static/") ? statics : media;
        if (await cache.match(href)) continue;
        const res = await fetch(href);
        if (res.ok) await cache.put(href, res);
      } catch {}
    }
    await trim(media);
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    // Uploaded dish photos (Supabase Storage).
    if (request.destination === "image") event.respondWith(staleWhileRevalidate(event, MEDIA));
    return;
  }
  if (NETWORK_ONLY.test(url.pathname)) return;
  if (request.mode === "navigate") {
    event.respondWith(page(event, url));
    return;
  }
  // React Server Component payloads: let Next.js handle failures (it falls back to a full navigation).
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC));
    return;
  }
  if (/^\\/(food|img|icons|splash)\\//.test(url.pathname) || request.destination === "image" || request.destination === "font") {
    event.respondWith(staleWhileRevalidate(event, MEDIA));
  }
});

async function page(event, url) {
  const cache = await caches.open(PAGES);
  const key = url.pathname;
  const cacheable = PUBLIC_PAGE.test(url.pathname);
  const network = (async () => {
    const res = (await event.preloadResponse) || (await fetch(event.request));
    if (cacheable && res.ok && res.type === "basic") await cache.put(key, res.clone());
    return res;
  })();
  event.waitUntil(network.catch(() => {}));
  try {
    return await Promise.race([network, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000))]);
  } catch {
    const cached = (await cache.match(key)) || (url.pathname.startsWith("/order/") ? null : await cache.match("/menu"));
    if (cached && cacheable) return cached;
    try {
      return await network;
    } catch {
      return (await cache.match(OFFLINE_URL)) || new Response("You are offline.", { status: 503, headers: { "Content-Type": "text/plain" } });
    }
  }
}

async function cacheFirst(request, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(event, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(event.request);
  const refresh = fetch(event.request)
    .then(async (res) => {
      if (res.ok || res.type === "opaque") {
        await cache.put(event.request, res.clone());
        await trim(cache);
      }
      return res;
    })
    .catch(() => hit || Response.error());
  if (hit) {
    event.waitUntil(refresh);
    return hit;
  }
  return refresh;
}

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MEDIA_LIMIT; i++) await cache.delete(keys[i]);
}
`;

export function GET() {
  return new Response(source, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
