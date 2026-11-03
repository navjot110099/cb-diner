import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/menu`, changeFrequency: "weekly", priority: 0.9 },
  ];
}
