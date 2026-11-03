import QRCode from "qrcode";
import { PrintButton } from "@/components/admin/print-button";
import { restaurant } from "@/lib/restaurant";
import { siteUrl } from "@/lib/site-url";

export const metadata = { title: "Table QR codes" };

/** Printable table cards: each QR opens /menu?table=N so orders arrive tagged with the table. */
export default async function QrPage() {
  const tables = Array.from({ length: restaurant.tableCount }, (_, i) => String(i + 1));
  const codes = await Promise.all(
    tables.map(async (n) => ({
      n,
      url: `${siteUrl}/menu?table=${n}`,
      svg: await QRCode.toString(`${siteUrl}/menu?table=${n}`, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1e1a17", light: "#00000000" } }),
    })),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 no-print">
        <div>
          <p className="eyebrow text-gold-deep">Print & place</p>
          <h1 className="mt-2 font-display text-5xl leading-none font-semibold">Table QR codes</h1>
          <p className="mt-3 max-w-xl text-stone">
            One card per table. Scanning opens the menu with the table number filled in, so every order reaches the kitchen tagged with the right table.
            Codes point to <span className="font-medium text-espresso">{siteUrl}</span>.
          </p>
        </div>
        <PrintButton />
      </div>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3 print:gap-6">
        {codes.map(({ n, url, svg }) => (
          <li key={n} className="flex flex-col items-center rounded-3xl bg-card px-4 pt-6 pb-5 text-center ring-1 ring-border break-inside-avoid print:ring-espresso/20">
            <p className="font-display text-[1.35rem] leading-none font-semibold">CB Diner</p>
            <p className="eyebrow mt-1.5 !text-[9px] text-gold-deep">Scan to order</p>
            <div className="mt-4 w-full max-w-[150px] rounded-2xl bg-white p-3 ring-1 ring-gold/40 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
            <p className="mt-4 font-display text-3xl leading-none font-semibold">Table {n}</p>
            <p className="mt-2 max-w-full truncate text-[10px] text-stone" title={url}>
              {url.replace(/^https?:\/\//, "")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
