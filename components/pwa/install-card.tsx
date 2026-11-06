"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";
import { useInstall } from "@/components/pwa/pwa";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "cb-install-dismissed";
const DISMISS_DAYS = 7;

function recentlyDismissed() {
  try {
    return Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

/**
 * "Add to home screen" card. Uses the native prompt on Android/Chrome and
 * shows the Share → Add to Home Screen hint on iOS Safari.
 */
export function InstallCard({ className, dismissible = true }: { className?: string; dismissible?: boolean }) {
  const { canPrompt, iosHint, available, install } = useInstall();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(dismissible && recentlyDismissed());
  }, [dismissible]);

  if (!available || hidden) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setHidden(true);
  };

  return (
    <div className={cn("relative flex items-start gap-4 rounded-2xl bg-card p-5 shadow-[0_14px_36px_-24px_rgba(30,26,23,.5)] ring-1 ring-border", className)}>
      <LogoMark className="size-12" />
      <div className="min-w-0 flex-1 pr-6">
        <p className="font-display text-xl font-semibold">{canPrompt ? "Add CB Diner to your phone" : "Install on iPhone"}</p>
        <p className="mt-0.5 text-sm text-stone">
          {canPrompt ? "Opens instantly, works on a weak signal — no app store needed." : "Tap the Share button, then choose “Add to Home Screen”."}
        </p>
        {canPrompt ? (
          <Button size="lg" className="mt-3 h-10 rounded-full px-5" onClick={() => install()}>
            <Download /> Install
          </Button>
        ) : iosHint ? (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-linen px-3 py-1 text-xs font-medium">
            <Share className="size-3.5" /> → “Add to Home Screen”
          </p>
        ) : null}
      </div>
      {dismissible && (
        <button type="button" onClick={dismiss} className="absolute top-3 right-3 rounded-full p-1.5 text-stone hover:bg-linen hover:text-espresso" aria-label="Not now">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Header install button. Opens the native prompt where the browser offers one
 * (Chrome, Edge, Android); on iPhone it toggles the Share → Add to Home Screen
 * hint. Renders nothing once the app is installed.
 */
export function InstallButton({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { canPrompt, iosHint, install } = useInstall();
  const [hint, setHint] = useState(false);
  if (!canPrompt && !iosHint) return null;
  const onClick = () => (canPrompt ? void install() : setHint((v) => !v));
  return (
    <span className="relative inline-flex">
      <Button
        variant="outline"
        size={compact ? "icon" : "sm"}
        aria-label={compact ? "Install app" : undefined}
        aria-expanded={iosHint ? hint : undefined}
        className={cn(compact ? "size-10 rounded-full" : "h-9 rounded-full", className)}
        onClick={onClick}
      >
        <Download /> {!compact && "Install app"}
      </Button>
      {hint && (
        <span role="status" className="absolute top-12 right-0 z-50 w-56 rounded-2xl bg-card p-3 text-left text-[13px] leading-snug text-espresso shadow-[0_14px_36px_-18px_rgba(30,26,23,.6)] ring-1 ring-border">
          <Share className="mb-1 size-4 text-gold-deep" />
          Tap <b>Share</b>, then <b>Add to Home Screen</b> to install CB Diner.
        </span>
      )}
    </span>
  );
}
