"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Plain <img> on purpose: menu photos are pre-sized WebP files (or Supabase
 * Storage URLs), so there's no optimizer round-trip and the service worker
 * can cache them. Falls back to a quiet monogram tile when offline or missing.
 */
export function FoodImage({ src, alt, className, priority = false }: { src: string | null | undefined; alt: string; className?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <FoodPlaceholder className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setFailed(true)}
      className={cn("bg-linen object-cover", className)}
    />
  );
}

export function FoodPlaceholder({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("flex items-center justify-center bg-linen font-display text-2xl font-semibold text-gold/70", className)}>
      CB
    </span>
  );
}
