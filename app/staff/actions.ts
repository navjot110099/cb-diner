"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_STAFF_COOKIE, safeNext } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function demoSignIn(formData: FormData) {
  if (!isDemoMode) redirect("/staff/login");
  const role = formData.get("role") === "admin" ? "admin" : "kitchen";
  (await cookies()).set(DEMO_STAFF_COOKIE, role, { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 12 });
  redirect(safeNext(formData.get("next"), role === "admin" ? "/admin" : "/kitchen"));
}

export type SignInState = { error: string | null };

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  if (isDemoMode) return { error: "Use the quick sign-in buttons above." };
  if (!rateLimit(`login:${await clientIp()}`, 8, 10 * 60_000).ok) return { error: "Too many attempts. Try again in a few minutes." };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Wrong email or password." };

  const { data: staff } = await createAdminClient().from("staff").select("role").eq("user_id", data.user.id).maybeSingle();
  if (!staff) {
    await supabase.auth.signOut();
    return { error: "This account isn’t on the staff list. Ask the owner to add you." };
  }
  redirect(safeNext(formData.get("next"), staff.role === "admin" ? "/admin" : "/kitchen"));
}

export async function signOut() {
  if (isDemoMode) (await cookies()).delete(DEMO_STAFF_COOKIE);
  else await (await createClient()).auth.signOut();
  redirect("/staff/login");
}
