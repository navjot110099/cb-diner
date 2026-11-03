/**
 * Captures the real CB Diner screens used by the portfolio slides.
 *
 *   NEXT_PUBLIC_SITE_URL=https://cbdiner.example npm run build
 *   npm start -- -p 3117
 *   PORTFOLIO_BASE_URL=http://localhost:3117 npx tsx portfolio/source/capture.ts
 *
 * Building with the reserved `.example` domain makes the table QR codes and
 * captions show a clean demo URL instead of localhost. Keep NEXT_PUBLIC_DEMO_TIME
 * (in .env.local) so every screen shows dinner service.
 *
 * Desktop: 1440×900 @2x. Mobile: 390×844 @3x. Each shot also records the boxes
 * of the elements the slides point at (anchors.json), so the numbered markers
 * land on the real UI, and the colour of the top pixel rows (for phone status bars).
 * The demo store is reset before each device pass. ONLY=d-home,m-menu limits the shots.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Browser, type BrowserContext, type Locator, type Page } from "playwright";
import sharp from "sharp";

const BASE = (process.env.PORTFOLIO_BASE_URL ?? "http://localhost:3117").replace(/\/$/, "");
const OUT = path.join(process.cwd(), "portfolio/source/shots");
const ONLY = process.env.ONLY?.split(",");

type Box = { x: number; y: number; w: number; h: number };
const anchors: Record<string, { w: number; h: number; a: Record<string, Box>; sb?: string; sbc?: string }> = {};

async function settle(page: Page, ms = 700) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => ((i.onload = r), (i.onerror = r), setTimeout(r, 5000)))));
  });
  await page.waitForTimeout(ms);
}

async function go(page: Page, url: string) {
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" });
  await settle(page);
}

async function scrollTo(page: Page, selector: string, offset = 0) {
  await page.evaluate(
    ([sel, off]) => {
      const el = document.querySelector(sel as string);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (off as number), behavior: "instant" });
    },
    [selector, offset] as const,
  );
  await page.waitForTimeout(700);
}

/** Average colour of the top rows: used as the phone mockup's status-bar background. */
async function topColour(file: string) {
  const img = sharp(file);
  const meta = await img.metadata();
  const { data } = await img.extract({ left: 0, top: 0, width: meta.width!, height: 6 }).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  const [r, g, b] = data;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return { sb: `rgb(${r},${g},${b})`, sbc: lum < 0.55 ? "#f8f5ef" : "#1e1a17" };
}

async function shot(page: Page, name: string, marks: Record<string, Locator> = {}) {
  if (ONLY && !ONLY.some((o) => name.startsWith(o))) return;
  await settle(page, 450);
  const vp = page.viewportSize()!;
  const a: Record<string, Box> = {};
  for (const [key, loc] of Object.entries(marks)) {
    const b = await loc.first().boundingBox().catch(() => null);
    if (!b) {
      console.warn(`    ! ${name}: anchor "${key}" not found`);
      continue;
    }
    a[key] = { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
  }
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file });
  anchors[name] = { w: vp.width, h: vp.height, a, ...(name.startsWith("m-") ? await topColour(file) : {}) };
  console.log(`  ✓ ${name}.png  (${Object.keys(a).join(", ")})`);
}

/** Element-only crop for the design-system slide. */
async function crop(loc: Locator, name: string, pad = 0) {
  if (ONLY && !ONLY.some((o) => name.startsWith(o))) return;
  const page = loc.page();
  await loc.first().scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(300);
  const b = await loc.first().boundingBox();
  if (!b) return console.warn(`    ! crop ${name} not found`);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), clip: { x: b.x - pad, y: b.y - pad, width: b.width + pad * 2, height: b.height + pad * 2 } });
  anchors[name] = { w: Math.round(b.width + pad * 2), h: Math.round(b.height + pad * 2), a: {} };
  console.log(`  ✓ ${name}.png (crop)`);
}

async function newContext(browser: Browser, mobile: boolean): Promise<BrowserContext> {
  return browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: mobile ? 3 : 2,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: "reduce",
    serviceWorkers: "allow",
  });
}

async function staffSignIn(page: Page, role: "kitchen" | "admin") {
  await go(page, "/staff/login");
  await page.getByRole("button", { name: role === "admin" ? /Owner \(admin\)/ : /Kitchen staff/ }).click();
  await page.waitForURL(role === "admin" ? "**/admin" : "**/kitchen", { timeout: 30_000 });
  await settle(page);
}

async function resetDemo(browser: Browser) {
  const ctx = await newContext(browser, false);
  const page = await ctx.newPage();
  await staffSignIn(page, "kitchen");
  const res = await page.request.post(`${BASE}/api/demo/reset`);
  if (!res.ok()) throw new Error(`demo reset failed: ${res.status()}`);
  await ctx.close();
}

const add = (page: Page, id: string) => page.locator(`#dish-${id}`).getByRole("button", { name: /^Add (?!one)/ }).first().click();
const more = (page: Page, id: string) => page.locator(`#dish-${id}`).getByRole("button", { name: /^Add one more/ }).first().click();

// ---------------------------------------------------------------------------------
async function desktop(browser: Browser) {
  console.log("\ndesktop 1440×900 @2x");
  const ctx = await newContext(browser, false);
  const page = await ctx.newPage();

  // Website ------------------------------------------------------------------------
  await go(page, "/");
  await shot(page, "d-home", {
    headline: page.locator("h1"),
    em: page.locator("h1 em"),
    cta: page.getByRole("link", { name: /View the menu/ }),
    status: page.locator("header").getByText("Open now"),
    rating: page.getByRole("link", { name: /Google reviews/ }),
    reserve: page.getByRole("link", { name: /Reserve/ }),
  });
  await crop(page.getByRole("link", { name: /View the menu/ }), "c-cta-gold", 10);
  await crop(page.locator("header").getByText("Open now").locator(".."), "c-status", 10);
  await scrollTo(page, "main > section:first-of-type", 0);
  await shot(page, "d-home-signature", { title: page.getByRole("heading", { name: "The house signatures" }), card: page.locator("main ul li").first() });
  await scrollTo(page, "main > section:nth-of-type(2)", 0);
  await shot(page, "d-home-ordering", { steps: page.locator("main ol").first() });
  await scrollTo(page, "#story", 0);
  await shot(page, "d-home-story");
  await scrollTo(page, "#visit", -30);
  await page.getByRole("button", { name: /Show map/ }).click();
  await page.waitForTimeout(4000);
  await shot(page, "d-home-visit", {
    hours: page.locator("#visit dl").first(),
    today: page.getByText("Today", { exact: true }),
    call: page.locator("#visit").getByRole("link", { name: "Call", exact: true }),
    whatsapp: page.locator("#visit").getByRole("link", { name: "WhatsApp", exact: true }),
    review: page.getByRole("link", { name: "Write a review" }),
    map: page.locator("#visit iframe"),
  });

  // Guest menu ------------------------------------------------------------------------
  await go(page, "/menu?table=5");
  await shot(page, "d-menu", {
    table: page.locator("header p.eyebrow").first(),
    search: page.locator('input[type="search"]'),
    veg: page.locator("label:has(button[role=switch])").first(),
    rail: page.locator("aside nav").first(),
    card: page.locator("#dish-oysters-half-dozen"),
    add: page.locator("#dish-oysters-half-dozen").getByRole("button", { name: /^Add / }),
    panel: page.locator("aside").last(),
    status: page.locator("header").getByText("Open now"),
  });
  await crop(page.locator("#dish-oysters-half-dozen").getByRole("button", { name: /^Add / }), "c-add", 12);
  await crop(page.locator("#dish-burrata-heirloom abbr").first().locator(".."), "c-diet", 8);

  await page.getByRole("navigation", { name: "Menu sections" }).last().getByRole("button", { name: /Prime Steaks/ }).click();
  await page.waitForTimeout(1100);
  await add(page, "filet-mignon");
  await more(page, "filet-mignon");
  await page.waitForTimeout(400);
  await shot(page, "d-menu-steaks", {
    active: page.locator('aside nav button[aria-current="true"]'),
    section: page.locator("#cat-steaks h2"),
    ribeye: page.locator("#dish-bone-in-ribeye"),
    tags: page.locator("#dish-tomahawk-for-two .eyebrow").first(),
    gf: page.locator("#dish-filet-mignon abbr").first(),
    stepper: page.locator("#dish-filet-mignon").getByRole("button", { name: /^Add one more/ }),
    panel: page.locator("aside").last().locator("ul").first(),
  });
  await crop(page.locator("#dish-filet-mignon").getByRole("button", { name: /^Add one more/ }).locator(".."), "c-stepper", 12);
  await crop(page.locator("#dish-tomahawk-for-two .eyebrow").first().locator(".."), "c-tags", 8);

  await page.locator("#dish-bone-in-ribeye").getByRole("button", { name: "Bone-In Ribeye · 22 oz", exact: true }).first().click();
  await page.waitForTimeout(900);
  const dialog = page.getByRole("dialog");
  await shot(page, "d-dish", { sheet: dialog, title: dialog.getByRole("heading"), diet: dialog.locator("abbr").first(), add: dialog.getByRole("button", { name: /^Add / }) });
  await dialog.getByRole("button", { name: /^Add / }).click();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  await page.fill('input[type="search"]', "lobster");
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, "d-search", { search: page.locator('input[type="search"]'), count: page.getByText(/\d+ dishes/) });
  await page.fill('input[type="search"]', "");
  await page.waitForTimeout(400);

  await page.locator("#dish-cb-old-fashioned").scrollIntoViewIfNeeded();
  await add(page, "cb-old-fashioned");
  await more(page, "cb-old-fashioned");
  const panel = page.locator("aside").last();
  await panel.getByLabel("Note for the kitchen").fill("Ribeye medium-rare, filets medium. Anniversary dinner!");
  await panel.getByLabel(/Name/).fill("Olivia");
  await panel.locator(".overflow-y-auto").evaluate((el) => (el.scrollTop = 120));
  await page.locator("#cat-bar").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await shot(page, "d-cart", {
    lines: panel.locator("ul").first(),
    table: panel.locator("select"),
    note: panel.locator("textarea"),
    subtotal: panel.getByText("Subtotal"),
    place: panel.getByRole("button", { name: /^Place order/ }),
    whatsapp: panel.getByRole("link", { name: /WhatsApp/ }),
  });
  await crop(panel.getByRole("button", { name: /^Place order/ }), "c-place", 10);

  await panel.getByRole("button", { name: /^Place order/ }).click();
  await page.waitForURL("**/order/**", { timeout: 30_000 });
  await settle(page, 1000);
  const orderPath = new URL(page.url()).pathname;
  await shot(page, "d-order", {
    eyebrow: page.locator("header p.eyebrow"),
    headline: page.locator("h1"),
    tracker: page.locator('section[aria-label="Live status"]'),
    whatsapp: page.getByRole("link", { name: /Send a copy on WhatsApp/ }),
    more: page.getByRole("link", { name: /Order more/ }),
  });

  // Kitchen -------------------------------------------------------------------------------
  const staff = await ctx.newPage();
  await staffSignIn(staff, "kitchen");
  await staff.getByRole("button", { name: "Simulate order" }).click();
  await staff.waitForTimeout(1500);
  await staff.evaluate(() => window.scrollTo(0, 0));
  await shot(staff, "d-kitchen", {
    pill: staff.getByText(/^Live · /),
    sound: staff.getByRole("button", { name: /Enable sound/ }),
    simulate: staff.getByRole("button", { name: "Simulate order" }),
    fresh: staff.locator("article", { has: staff.getByText("NEW", { exact: true }) }),
    late: staff.locator("article span.bg-rose-gold").first(),
    start: staff.getByRole("button", { name: /Start \/ fire/ }).first(),
    note: staff.getByText(/Celebrating an anniversary/),
    served: staff.locator('section[aria-label="Served"] article').first(),
    toast: staff.locator("[data-sonner-toast]"),
  });
  await staff.locator("article", { hasText: "Olivia" }).first().getByRole("button", { name: /Start \/ fire/ }).click();
  await staff.waitForTimeout(900);
  await page.bringToFront();
  await go(page, orderPath);
  await shot(page, "d-order-live", { tracker: page.locator('section[aria-label="Live status"]'), headline: page.locator("h1") });

  // Admin ---------------------------------------------------------------------------------------
  await staffSignIn(staff, "admin");
  await shot(staff, "d-admin", {
    stats: staff.locator("dl").first(),
    add: staff.getByRole("link", { name: /Add a dish/ }),
    orders: staff.locator("table"),
    nav: staff.getByRole("link", { name: /Table QR codes/ }),
  });
  await staff.getByRole("heading", { name: "Dishes" }).scrollIntoViewIfNeeded();
  await scrollTo(staff, "section:last-of-type", 84);
  await staff.getByLabel("Japanese A5 Wagyu · 4 oz available").click();
  await staff.waitForTimeout(1200);
  await shot(staff, "d-admin-dishes", {
    search: staff.getByPlaceholder("Search dishes"),
    chips: staff.getByRole("button", { name: "All", exact: true }),
    switch: staff.getByLabel("Japanese A5 Wagyu · 4 oz available"),
    soldout: staff.locator("li", { hasText: "Japanese A5 Wagyu" }),
    edit: staff.getByRole("link", { name: /Edit Japanese A5 Wagyu/ }),
    toast: staff.locator("[data-sonner-toast]"),
  });
  await go(staff, "/admin/items/bone-in-ribeye");
  await shot(staff, "d-admin-edit", {
    name: staff.locator("#name"),
    price: staff.locator("#price"),
    labels: staff.locator("fieldset"),
    switches: staff.getByText("On the menu", { exact: true }),
    photo: staff.getByRole("button", { name: /Dish photo preview/ }),
    hint: staff.getByText(/Resized on your device/),
    save: staff.getByRole("button", { name: /Save changes/ }),
  });
  await go(staff, "/admin/qr");
  await shot(staff, "d-qr", { card: staff.locator("main li, ul li").first(), print: staff.getByRole("button", { name: /Print cards/ }) });
  await go(staff, "/staff/login");
  await shot(staff, "d-login", { kitchen: staff.getByRole("button", { name: /Kitchen staff/ }), owner: staff.getByRole("button", { name: /Owner \(admin\)/ }) });
  await staff.close();

  await go(page, "/offline");
  await shot(page, "d-offline");
  await ctx.close();
}

// ---------------------------------------------------------------------------------
async function mobile(browser: Browser) {
  console.log("\nmobile 390×844 @3x");
  const ctx = await newContext(browser, true);
  const page = await ctx.newPage();

  await go(page, "/");
  await shot(page, "m-home", { headline: page.locator("h1"), cta: page.getByRole("link", { name: /View the menu/ }), status: page.locator("header").getByText("Open now") });
  await scrollTo(page, "#visit", -10);
  await shot(page, "m-home-visit");

  await go(page, "/menu?table=5");
  await shot(page, "m-menu", { table: page.locator("header p.eyebrow").first(), chips: page.locator('nav[aria-label="Menu sections"]').first() });

  await page.getByRole("button", { name: "Prime Steaks", exact: true }).first().click();
  await page.waitForTimeout(1100);
  await add(page, "filet-mignon");
  await more(page, "filet-mignon");
  await add(page, "bone-in-ribeye");
  await page.waitForTimeout(600);
  await shot(page, "m-menu-steaks", {
    chip: page.locator('nav[aria-label="Menu sections"] button[aria-current="true"]').first(),
    stepper: page.locator("#dish-filet-mignon").getByRole("button", { name: /^Add one more/ }),
    bar: page.getByRole("button", { name: /View order/ }),
  });

  await page.locator("#dish-new-york-strip").getByRole("button", { name: /New York Strip/, exact: false }).first().click();
  await page.waitForTimeout(900);
  await shot(page, "m-dish", { sheet: page.getByRole("dialog"), title: page.getByRole("dialog").getByRole("heading"), add: page.getByRole("dialog").getByRole("button", { name: /^Add / }) });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  await page.locator("#dish-cb-old-fashioned").scrollIntoViewIfNeeded();
  await add(page, "cb-old-fashioned");
  await more(page, "cb-old-fashioned");
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /View order/ }).click();
  await page.waitForTimeout(900);
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Note for the kitchen").fill("Ribeye medium-rare. Anniversary!");
  await sheet.getByLabel(/Name/).fill("Sophia");
  await sheet.locator(".overflow-y-auto").evaluate((el) => (el.scrollTop = 0));
  await shot(page, "m-cart", { sheet, lines: sheet.locator("ul").first(), place: sheet.getByRole("button", { name: /^Place order/ }), whatsapp: sheet.getByRole("link", { name: /WhatsApp/ }) });
  await sheet.locator(".overflow-y-auto").evaluate((el) => (el.scrollTop = el.scrollHeight));
  await shot(page, "m-cart-note", { note: sheet.locator("textarea"), place: sheet.getByRole("button", { name: /^Place order/ }) });

  await sheet.getByRole("button", { name: /^Place order/ }).click();
  await page.waitForURL("**/order/**", { timeout: 30_000 });
  await settle(page, 1000);
  const orderPath = new URL(page.url()).pathname;
  await shot(page, "m-order", { eyebrow: page.locator("header p.eyebrow"), headline: page.locator("h1"), tracker: page.locator('section[aria-label="Live status"]') });

  const staff = await ctx.newPage();
  await staffSignIn(staff, "kitchen");
  await shot(staff, "m-kitchen", { tabs: staff.getByRole("tablist") });
  await staff.locator("article", { hasText: "Sophia" }).first().getByRole("button", { name: /Start \/ fire/ }).click();
  await staff.waitForTimeout(900);
  await page.bringToFront();
  await go(page, orderPath);
  await shot(page, "m-order-live", { tracker: page.locator('section[aria-label="Live status"]'), headline: page.locator("h1") });

  await staffSignIn(staff, "admin");
  await scrollTo(staff, "section:last-of-type", 70);
  await shot(staff, "m-admin", { list: staff.locator("section:last-of-type ul").first() });
  await go(staff, "/admin/qr");
  await shot(staff, "m-qr");
  await staff.close();

  // Offline: reload the menu with the network cut; the service worker serves it.
  await go(page, "/menu?table=7");
  await page.evaluate(async () => Boolean((await navigator.serviceWorker?.ready)?.active));
  await page.waitForTimeout(3000);
  await ctx.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(page, 900);
  await shot(page, "m-offline", { banner: page.getByText(/You’re offline/) });
  await ctx.setOffline(false);
  await ctx.close();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  try {
    if (!process.env.SKIP_DESKTOP) {
      await resetDemo(browser);
      await desktop(browser);
    }
    if (!process.env.SKIP_MOBILE) {
      await resetDemo(browser);
      await mobile(browser);
    }
  } finally {
    await browser.close();
  }
  const file = path.join(OUT, "anchors.json");
  const prev = ONLY || process.env.SKIP_DESKTOP || process.env.SKIP_MOBILE ? JSON.parse(await readFile(file, "utf8").catch(() => "{}")) : {};
  const merged = { ...prev, ...anchors };
  await writeFile(file, JSON.stringify(merged, null, 1));
  await writeFile(path.join(OUT, "anchors.js"), `window.ANCHORS = ${JSON.stringify(merged)};\n`);
  console.log(`\nSaved to ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
