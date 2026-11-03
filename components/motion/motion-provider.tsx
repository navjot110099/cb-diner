"use client";

import { LazyMotion, MotionConfig } from "framer-motion";

// Animation features load after first paint, keeping them out of the initial bundle on low-end phones.
const loadFeatures = () => import("@/components/motion/features").then((mod) => mod.default);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 520, damping: 38 }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
