import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/env";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { StaffRole, StaffUser } from "@/lib/types";

/** Demo mode has no real auth: this cookie picks the demo kitchen or owner account. */
export const DEMO_STAFF_COOKIE = "cb_demo_staff";

const DEMO_STAFF: Record<StaffRole, StaffUser> = {
  kitchen: { id: "demo-kitchen", name: "Kitchen", email: null, role: "kitchen" },
  admin: { id: "demo-owner", name: "Owner", email: null, role: "admin" },
};

export const getStaff = cache(async (): Promise<StaffUser | null> => {
  if (isDemoMode) {
    const role = (await cookies()).get(DEMO_STAFF_COOKIE)?.value;
    return role === "kitchen" || role === "admin" ? DEMO_STAFF[role] : null;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;

  const { data: staff } = await createAdminClient().from("staff").select("name, role").eq("user_id", user.id).maybeSingle();
  if (!staff) return null;
  return {
    id: user.id,
    email: user.email ?? null,
    name: staff.name || user.email?.split("@")[0] || "Staff",
    role: staff.role === "admin" ? "admin" : "kitchen",
  };
});

/** Only same-site relative paths are allowed as post-login destinations. */
export function safeNext(next: unknown, fallback: string) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

export async function requireStaff(next: string) {
  const staff = await getStaff();
  if (!staff) redirect(`/staff/login?next=${encodeURIComponent(next)}`);
  return staff;
}

export async function requireAdmin(next = "/admin") {
  const staff = await requireStaff(next);
  if (staff.role !== "admin") redirect("/kitchen?denied=admin");
  return staff;
}
