"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, ExternalLink, LayoutGrid, LogOut, QrCode } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { signOut } from "@/app/staff/actions";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Menu", icon: LayoutGrid },
  { href: "/admin/qr", label: "Table QR codes", icon: QrCode },
  { href: "/kitchen", label: "Kitchen", icon: ChefHat },
];

export function AdminNav({ name, demo }: { name: string; demo: boolean }) {
  const pathname = usePathname();
  return (
    <header className="bg-night sticky top-0 z-30 text-ivory no-print">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/admin" className="mr-auto">
          <Logo tone="light" sub={demo ? "Admin · demo mode" : "Admin"} />
        </Link>
        <nav className="order-last -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/items") : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm transition-colors",
                  active ? "bg-white/12 font-semibold text-gold-light ring-1 ring-gold/30" : "text-ivory/75 hover:bg-white/8 hover:text-ivory",
                )}
              >
                <Icon className="size-4" /> {label}
              </Link>
            );
          })}
          <Link href="/menu" target="_blank" className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm text-ivory/75 hover:bg-white/8 hover:text-ivory">
            <ExternalLink className="size-4" /> Guest menu
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-ivory/60 md:inline">{name}</span>
          <form action={signOut}>
            <button className="inline-flex size-9 items-center justify-center rounded-full bg-white/8 ring-1 ring-white/15 hover:bg-white/15" aria-label="Sign out">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
