import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Hanken_Grotesk } from "next/font/google";
import { PwaRoot } from "@/components/pwa/pwa";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

// Headings only use Cormorant 600; the italic face is just for the gold accents on the homepage, so it isn't preloaded.
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: "600", display: "swap" });
const cormorantItalic = Cormorant_Garamond({ variable: "--font-cormorant-italic", subsets: ["latin"], weight: "500", style: "italic", display: "swap", preload: false });
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CB Diner — Prime steakhouse & raw bar on Park Avenue South",
    template: "%s · CB Diner",
  },
  description:
    "Dry-aged USDA Prime steaks, Maine lobster, a raw bar and classic cocktails on Park Avenue South, New York. Scan the QR code at your table to order from your phone.",
  applicationName: "CB Diner",
  keywords: ["CB Diner", "steakhouse NYC", "Park Avenue South restaurant", "dry-aged steak", "raw bar", "fine dining New York", "QR menu"],
  appleWebApp: { capable: true, title: "CB Diner", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  openGraph: { type: "website", siteName: "CB Diner", locale: "en_US", url: "/" },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1e1a17",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** iOS ignores the manifest splash, so each common iPhone size gets its own startup image. */
const IOS_SPLASH = [
  { w: 375, h: 667, r: 2 },
  { w: 414, h: 896, r: 2 },
  { w: 375, h: 812, r: 3 },
  { w: 390, h: 844, r: 3 },
  { w: 393, h: 852, r: 3 },
  { w: 414, h: 896, r: 3 },
  { w: 428, h: 926, r: 3 },
  { w: 430, h: 932, r: 3 },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${cormorantItalic.variable} ${hanken.variable}`}>
      <head>
        {IOS_SPLASH.map(({ w, h, r }) => (
          <link
            key={`${w}x${h}@${r}`}
            rel="apple-touch-startup-image"
            href={`/splash/splash-${w * r}x${h * r}.png`}
            media={`(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`}
          />
        ))}
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        <PwaRoot />
      </body>
    </html>
  );
}
