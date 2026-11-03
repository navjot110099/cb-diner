import type { Metadata } from "next";
import Link from "next/link";
import { ChefHat, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "@/components/staff/login-form";
import { demoSignIn } from "@/app/staff/actions";
import { safeNext } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Staff login", robots: { index: false } };

export default async function StaffLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const nextPath = safeNext(next, "");

  return (
    <div className="bg-night relative isolate flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] bg-card p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,.6)] sm:p-8">
        <Link href="/" className="inline-block">
          <Logo sub="Staff portal" />
        </Link>
        <h1 className="mt-7 font-display text-4xl font-semibold">Staff sign-in</h1>
        <p className="mt-1.5 text-stone">Kitchen screen and menu admin for CB Diner.</p>

        {isDemoMode ? (
          <div className="mt-6 space-y-3">
            <p className="rounded-xl bg-accent px-3 py-2 text-sm text-gold-deep">
              Demo mode — no Supabase keys are set, so pick a role to look around. Changes stay in this server’s memory.
            </p>
            <form action={demoSignIn} className="grid gap-3">
              <input type="hidden" name="next" value={nextPath} />
              <button
                name="role"
                value="kitchen"
                className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-4 text-left transition hover:border-gold hover:shadow-md"
              >
                <span className="bg-gold flex size-12 items-center justify-center rounded-xl text-espresso">
                  <ChefHat className="size-6" />
                </span>
                <span>
                  <span className="block font-semibold">Kitchen staff</span>
                  <span className="text-sm text-stone">Live order screen with sound alerts</span>
                </span>
              </button>
              <button
                name="role"
                value="admin"
                className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-4 text-left transition hover:border-gold hover:shadow-md"
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-espresso text-gold-light">
                  <LayoutDashboard className="size-6" />
                </span>
                <span>
                  <span className="block font-semibold">Owner (admin)</span>
                  <span className="text-sm text-stone">Menu, prices, photos, table QR codes</span>
                </span>
              </button>
            </form>
          </div>
        ) : (
          <LoginForm next={nextPath} />
        )}

        <p className="mt-8 text-center text-xs text-stone">
          <Link href="/menu" className="underline-offset-4 hover:underline">
            Guest menu
          </Link>{" "}
          · Demo project by OVIOWEB
        </p>
      </div>
    </div>
  );
}
