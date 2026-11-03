import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireAdmin();
  return (
    <div className="min-h-dvh bg-linen/60">
      <AdminNav name={staff.name} demo={isDemoMode} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">{children}</div>
      <p className="pb-6 text-center text-xs text-stone">Demo project by OVIOWEB</p>
      <Toaster position="top-center" />
    </div>
  );
}
