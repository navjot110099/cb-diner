import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEMO_STAFF_COOKIE = "cb_demo_staff";

/**
 * Keeps signed-out visitors away from /kitchen and /admin and refreshes the
 * Supabase session cookie. Roles are checked again in the pages themselves.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  let signedIn = false;

  if (SUPABASE_URL && SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value } of toSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  } else {
    const role = request.cookies.get(DEMO_STAFF_COOKIE)?.value;
    signedIn = role === "kitchen" || role === "admin";
  }

  if (!signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/staff/login";
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/kitchen/:path*", "/admin/:path*"],
};
