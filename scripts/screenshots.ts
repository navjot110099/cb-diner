/**
 * Captures every key CB Diner screen at desktop (1440×900) and mobile
 * (390×844) into /screenshots, walking the real flow: guest orders from
 * Table 5 → kitchen fires it → guest sees the update → owner edits the menu.
 * It also checks the service worker by reloading the menu offline.
 *
 *   npm run build && npm start      # demo mode, in one terminal
 *   npm run screenshots             # in another
 *
 * Env: SCREENSHOT_BASE_URL (default http://localhost:3000).
 */
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

const BASE = (process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = path.join(process.cwd(), "screenshots");

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, scale: 1, mobile: false },
  { name: "mobile", width: 390, height: 844, scale: 2, mobile: true },
] as const;
type Viewport = (typeof VIEWPORTS)[number];

async function settle(page: Page, ms = 600) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const imgs = Array.from(document.images).filter((i) => !i.complete);
    await Promise.all(imgs.map((i) => new Promise((r) => ((i.onload = r), (i.onerror = r), setTimeout(r, 4000)))));
  });
  await page.waitForTimeout(ms);
}

async function go(page: Page, url: string) {
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" });
  await settle(page);
}

async function shot(page: Page, vp: Viewport, name: string, opts: { fullPage?: boolean } = {}) {
  if (opts.fullPage) {
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
    });
    await settle(page, 400);
  }
  const file = path.join(OUT, vp.name, `${name}.png`);
  await page.screenshot({ path: file, fullPage: opts.fullPage ?? false });
  console.log(`  ✓ ${vp.name}/${name}.png`);
  return file;
}

async function scrollTo(page: Page, selector: string, offset = 0) {
  await page.evaluate(
    ([sel, off]) => {
      const el = document.querySelector(sel as string);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (off as number), behavior: "instant" });
    },
    [selector, offset] as const,
  );
  await page.waitForTimeout(500);
}

async function staffSignIn(page: Page, role: "kitchen" | "admin") {
  await go(page, "/staff/login");
  await page.getByRole("button", { name: role === "admin" ? /Owner \(admin\)/ : /Kitchen staff/ }).click();
  await page.waitForURL(role === "admin" ? "**/admin" : "**/kitchen", { timeout: 30_000 });
  await settle(page);
}

async function newContext(browser: Browser, vp: Viewport) {
  return browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.scale,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    reducedMotion: "reduce",
    serviceWorkers: "allow",
  });
}

async function capture(browser: Browser, vp: Viewport) {
  console.log(`\n${vp.name} (${vp.width}×${vp.height})`);
  await mkdir(path.join(OUT, vp.name), { recursive: true });
  const context = await newContext(browser, vp);
  const page = await context.newPage();

  // Start every viewport from the same seeded demo data.
  await staffSignIn(page, "kitchen");
  await page.request.post(`${BASE}/api/demo/reset`);
  await context.clearCookies();

  // --- Home -------------------------------------------------------------------
  await go(page, "/");
  await shot(page, vp, "01-home");
  await shot(page, vp, "02-home-full", { fullPage: true });
  await scrollTo(page, "#visit", vp.mobile ? 0 : 40);
  await page.getByRole("button", { name: /Show map/ }).click();
  await page.waitForTimeout(3500);
  await shot(page, vp, "03-home-visit-map");

  // --- Guest menu at Table 5 --------------------------------------------------------
  await go(page, "/menu?table=5");
  const menuShot = await shot(page, vp, "04-menu");
  if (vp.name === "mobile") await copyFile(menuShot, path.join(process.cwd(), "public/pwa/menu-mobile.png"));
  else await copyFile(menuShot, path.join(process.cwd(), "public/pwa/menu-desktop.png"));

  if (vp.mobile) {
    await page.getByRole("button", { name: "Prime Steaks", exact: true }).first().click();
    await page.waitForTimeout(900);
    await shot(page, vp, "05-menu-steaks");
  } else {
    await page.getByRole("navigation", { name: "Menu sections" }).last().getByRole("button", { name: /Prime Steaks/ }).click();
    await page.waitForTimeout(900);
    await shot(page, vp, "05-menu-steaks");
  }

  await page.locator("#dish-bone-in-ribeye").getByRole("button", { name: "Bone-In Ribeye · 22 oz", exact: true }).first().click();
  await page.waitForTimeout(700);
  await shot(page, vp, "06-menu-dish");
  await page.getByRole("dialog").getByRole("button", { name: /^Add Bone-In Ribeye/ }).click();
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);

  for (const id of ["filet-mignon", "lobster-mac", "truffle-parmesan-fries"]) {
    await page.locator(`#dish-${id}`).getByRole("button", { name: /^Add / }).first().click();
    await page.waitForTimeout(150);
  }
  await page.locator("#dish-filet-mignon").getByRole("button", { name: /^Add one more/ }).first().click();
  await page.locator("#dish-cb-old-fashioned").getByRole("button", { name: /^Add / }).first().click();
  await page.locator("#dish-cb-old-fashioned").getByRole("button", { name: /^Add one more/ }).first().click();
  await page.waitForTimeout(500);
  await shot(page, vp, "07-menu-with-order");

  await page.fill('input[type="search"]', "lobster");
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, vp, "08-menu-search");
  await page.fill('input[type="search"]', "");
  await page.waitForTimeout(300);

  // Cart: bottom sheet on phones, side panel on desktop.
  if (vp.mobile) {
    await page.getByRole("button", { name: /View order/ }).click();
    await page.waitForTimeout(700);
  }
  const cart = vp.mobile ? page.getByRole("dialog") : page.locator("aside").last();
  await cart.getByLabel("Note for the kitchen").fill("Ribeye medium-rare, filets medium. Celebrating tonight!");
  await cart.getByLabel(/Name/).fill("Olivia");
  await page.waitForTimeout(300);
  await shot(page, vp, "09-cart");

  await cart.getByRole("button", { name: /^Place order/ }).click();
  await page.waitForURL("**/order/**", { timeout: 30_000 });
  await settle(page, 900);
  const orderUrl = page.url().replace(BASE, "").replace("?placed=1", "");
  await shot(page, vp, "10-order-placed");

  // --- Kitchen ------------------------------------------------------------------------
  const staff = await context.newPage();
  await staffSignIn(staff, "kitchen");
  await shot(staff, vp, "11-kitchen");
  await staff.getByRole("button", { name: "Simulate order" }).click();
  await staff.waitForTimeout(1200);
  await staff.evaluate(() => window.scrollTo(0, 0));
  await shot(staff, vp, "12-kitchen-new-ticket");

  const olivia = staff.locator("article", { hasText: "Olivia" }).first();
  await olivia.getByRole("button", { name: /Start \/ fire/ }).click();
  await staff.waitForTimeout(800);
  if (vp.mobile) {
    await staff.getByRole("tab", { name: /Firing/ }).click();
    await staff.waitForTimeout(500);
  }
  await staff.evaluate(() => window.scrollTo(0, 0));
  await staff.waitForTimeout(300);
  await shot(staff, vp, "13-kitchen-firing");

  // Guest page picks up the change.
  await page.bringToFront();
  await go(page, orderUrl);
  await shot(page, vp, "14-order-in-kitchen");

  // --- Admin --------------------------------------------------------------------------
  await staffSignIn(staff, "admin");
  await shot(staff, vp, "15-admin");
  await scrollTo(staff, "section:last-of-type", 70);
  await shot(staff, vp, "16-admin-dishes");
  await go(staff, "/admin/items/bone-in-ribeye");
  await shot(staff, vp, "17-admin-edit-dish");
  await go(staff, "/admin/qr");
  await shot(staff, vp, "18-admin-table-qr");
  await go(staff, "/staff/login");
  await shot(staff, vp, "19-staff-login");
  await staff.close();

  // --- Offline (service worker) ---------------------------------------------------------
  await go(page, "/menu?table=7");
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker?.ready;
    return Boolean(reg?.active);
  });
  await page.waitForTimeout(2500); // let the worker cache the page's assets
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(page, 800);
  const offlineOk = await page.getByText("You’re offline — showing the saved menu.").isVisible().catch(() => false);
  console.log(`  ${offlineOk ? "✓" : "✗"} menu reloads offline from the service worker cache`);
  await shot(page, vp, "20-menu-offline");
  await page.goto(`${BASE}/some-uncached-page`, { waitUntil: "domcontentloaded" }).catch(() => {});
  await settle(page, 500);
  await shot(page, vp, "21-offline-fallback");
  await context.setOffline(false);

  await context.close();
}

async function main() {
  await mkdir(path.join(process.cwd(), "public/pwa"), { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) await capture(browser, vp);
  } finally {
    await browser.close();
  }
  console.log(`\nSaved to ${path.relative(process.cwd(), OUT)}/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

export type { BrowserContext };
