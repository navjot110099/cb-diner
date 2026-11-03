import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "CB Diner — Park Avenue South",
    short_name: "CB Diner",
    description: "Order from your table at CB Diner: prime steaks, raw bar and cocktails. Works offline.",
    start_url: "/menu?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1e1a17",
    theme_color: "#1e1a17",
    categories: ["food", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      { src: "/pwa/menu-mobile.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "Table menu" },
      { src: "/pwa/menu-desktop.png", sizes: "1440x900", type: "image/png", form_factor: "wide", label: "Menu with order panel" },
    ],
    shortcuts: [
      { name: "Menu", short_name: "Menu", url: "/menu", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Kitchen screen", short_name: "Kitchen", url: "/kitchen", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
