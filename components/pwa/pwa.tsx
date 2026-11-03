"use client";

import { useEffect, useSyncExternalStore } from "react";

/* ---------------------------------------------------------------------------
 * Install prompt store. Chrome fires `beforeinstallprompt` once per page load;
 * we stash it so any component can offer "Install" at a good moment.
 * ------------------------------------------------------------------------- */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: InstallPromptEvent | null = null;
let justInstalled = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as InstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    justInstalled = true;
    emit();
  });
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

type InstallState = { canPrompt: boolean; iosHint: boolean; installed: boolean };
let cached: InstallState = { canPrompt: false, iosHint: false, installed: false };

function snapshot(): InstallState {
  const installed = justInstalled || isStandalone();
  const next = { canPrompt: !installed && deferredPrompt !== null, iosHint: !installed && isIos(), installed };
  if (next.canPrompt !== cached.canPrompt || next.iosHint !== cached.iosHint || next.installed !== cached.installed) cached = next;
  return cached;
}

const serverSnapshot: InstallState = { canPrompt: false, iosHint: false, installed: false };

export function useInstall() {
  const state = useSyncExternalStore(subscribe, snapshot, () => serverSnapshot);
  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    emit();
    return outcome === "accepted";
  };
  return { ...state, available: state.canPrompt || state.iosHint, install };
}

/* ---------------------------------------------------------------------------
 * Online status.
 * ------------------------------------------------------------------------- */

const subscribeOnline = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export function useOnline() {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

/* ---------------------------------------------------------------------------
 * Service worker registration. After the worker is ready we hand it every
 * same-origin asset this page already loaded, so the very first visit is
 * enough for the menu to open offline.
 * ------------------------------------------------------------------------- */

export function PwaRoot() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_SW_DEV !== "1") return;

    let cancelled = false;
    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        const ready = await navigator.serviceWorker.ready;
        if (cancelled) return;
        const urls = performance
          .getEntriesByType("resource")
          .map((e) => e.name)
          .filter((u) => u.startsWith(location.origin) && /\/_next\/static\/|\/food\/|\/img\/|\/icons\//.test(u));
        ready.active?.postMessage({ type: "CACHE_URLS", urls, page: location.pathname + location.search });
      } catch (error) {
        console.warn("Service worker registration failed", error);
      }
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
