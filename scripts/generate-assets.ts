/**
 * Renders the PWA icons, iOS splash screens, favicon and Open Graph image
 * with Playwright, so they use the real brand fonts.
 *
 *   npm run assets
 */
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";
import sharp from "sharp";

const ROOT = process.cwd();
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,500&family=Hanken+Grotesk:wght@500;600&display=block" rel="stylesheet">`;
const BASE_CSS = `*{margin:0;box-sizing:border-box}html,body{width:100%;height:100%;background:transparent}body{font-family:'Hanken Grotesk',sans-serif;-webkit-font-smoothing:antialiased}`;
const GOLD = "linear-gradient(120deg,#e8d3a8 0%,#d2b07a 30%,#b8935a 62%,#9c6b5a 100%)";

/** The CB monogram: double gold ring + gold-gradient letters. `size` is the ring diameter in px. */
function monogram(size: number) {
  const ring = Math.max(1.5, size * 0.018);
  return `
    <div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center">
      <div style="position:absolute;inset:0;border-radius:50%;border:${ring}px solid #c9a66b"></div>
      <div style="position:absolute;inset:${size * 0.07}px;border-radius:50%;border:${ring * 0.6}px solid rgba(201,166,107,.35)"></div>
      <span style="font-family:'Cormorant Garamond',serif;font-weight:600;font-size:${size * 0.42}px;letter-spacing:.02em;line-height:1;transform:translateY(${size * 0.02}px);background:${GOLD};-webkit-background-clip:text;color:transparent">CB</span>
    </div>`;
}

async function render(page: Page, html: string, width: number, height: number, out: string) {
  await page.setViewportSize({ width, height });
  await page.setContent(`<!doctype html><html><head>${FONTS}<style>${BASE_CSS}</style></head><body>${html}</body></html>`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await mkdir(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, omitBackground: true });
  console.log("  ✓", path.relative(ROOT, out));
}

const night = `background:radial-gradient(120% 90% at 50% 10%,#2c2621 0%,#1e1a17 55%,#141110 100%)`;

function icon(size: number, maskable: boolean) {
  // Maskable icons keep the mark inside the central 80% safe zone.
  const mark = Math.round(size * (maskable ? 0.56 : 0.74));
  const radius = maskable ? 0 : size * 0.22;
  return `<div style="width:${size}px;height:${size}px;border-radius:${radius}px;${night};display:flex;align-items:center;justify-content:center">${monogram(mark)}</div>`;
}

function splash(w: number, h: number) {
  const mark = Math.round(Math.min(w, h) * 0.3);
  return `<div style="width:${w}px;height:${h}px;${night};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${mark * 0.22}px">
    ${monogram(mark)}
    <div style="text-align:center">
      <div style="font-family:'Cormorant Garamond',serif;font-weight:600;font-size:${mark * 0.36}px;color:#f8f5ef;letter-spacing:.01em">CB Diner</div>
      <div style="margin-top:${mark * 0.06}px;font-size:${mark * 0.075}px;letter-spacing:.32em;text-transform:uppercase;color:#d9be8c">New York · Est. 1987</div>
    </div>
  </div>`;
}

/** Minimal .ico container that embeds PNG images (supported by every modern browser). */
function ico(pngs: { size: number; data: Buffer }[]) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries: Buffer[] = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  console.log("Icons");
  for (const size of [32, 48, 192, 512]) await render(page, icon(size, false), size, size, path.join(ROOT, `public/icons/icon-${size}.png`));
  await render(page, icon(512, true), 512, 512, path.join(ROOT, "public/icons/maskable-512.png"));
  await render(page, icon(180, true), 180, 180, path.join(ROOT, "public/icons/apple-touch-icon.png"));
  const favicon = ico([
    { size: 32, data: await readFile(path.join(ROOT, "public/icons/icon-32.png")) },
    { size: 48, data: await readFile(path.join(ROOT, "public/icons/icon-48.png")) },
  ]);
  await writeFile(path.join(ROOT, "app/favicon.ico"), favicon);
  console.log("  ✓ app/favicon.ico");

  console.log("iOS splash screens");
  for (const [w, h] of [
    [750, 1334],
    [828, 1792],
    [1125, 2436],
    [1170, 2532],
    [1179, 2556],
    [1242, 2688],
    [1284, 2778],
    [1290, 2796],
  ]) {
    await render(page, splash(w, h), w, h, path.join(ROOT, `public/splash/splash-${w}x${h}.png`));
  }

  console.log("Open Graph image");
  const hero = (await readFile(path.join(ROOT, "public/img/hero-dining.webp"))).toString("base64");
  await render(
    page,
    `<div style="position:relative;width:1200px;height:630px;overflow:hidden;background:#1e1a17">
      <img src="data:image/webp;base64,${hero}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
      <div style="position:absolute;inset:0;background:linear-gradient(95deg,rgba(20,17,16,.96) 0%,rgba(20,17,16,.8) 48%,rgba(20,17,16,.25) 100%)"></div>
      <div style="position:absolute;left:0;right:0;bottom:0;height:2px;background:${GOLD}"></div>
      <div style="position:absolute;left:80px;top:72px;display:flex;align-items:center;gap:18px">${monogram(74)}
        <div><div style="font-family:'Cormorant Garamond',serif;font-weight:600;font-size:38px;color:#f8f5ef">CB Diner</div>
        <div style="font-size:13px;letter-spacing:.3em;text-transform:uppercase;color:#d9be8c;margin-top:4px">New York · Est. 1987</div></div>
      </div>
      <div style="position:absolute;left:80px;bottom:96px;max-width:720px">
        <div style="font-size:16px;letter-spacing:.28em;text-transform:uppercase;color:#d9be8c">Prime steaks · Raw bar · Cocktails</div>
        <div style="font-family:'Cormorant Garamond',serif;font-weight:600;font-size:92px;line-height:.95;color:#f8f5ef;margin-top:18px">An American <i style="font-weight:500;background:${GOLD};-webkit-background-clip:text;color:transparent">grand</i> dining room.</div>
      </div>
    </div>`,
    1200,
    630,
    path.join(ROOT, "scripts/.og.png"),
  );
  // JPEG keeps the share image small for chat apps that fetch it on slow networks.
  await sharp(path.join(ROOT, "scripts/.og.png")).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(ROOT, "app/opengraph-image.jpg"));
  await unlink(path.join(ROOT, "scripts/.og.png"));
  console.log("  ✓ app/opengraph-image.jpg");

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
