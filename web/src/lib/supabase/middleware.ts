import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/auth"];

// Admin-only routes. Business/Pro-gated routes (Monitor) check
// user_profiles.business_approved the same way once that page exists.
const ADMIN_PATHS = ["/security"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Refreshes the Supabase session cookie on every request and enforces
// route/role gating server-side — mirrors the old app's client-only
// _isAdmin/_isPro checks, but now authoritative rather than UI-only.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // "Free without login": when the Supabase project has Anonymous Sign-ins enabled,
  // silently create an anonymous session instead of forcing /login. Guarded by the
  // ALLOW_ANON env flag (server-only) so the old hard gate stays until the project is
  // configured — and if signInAnonymously still fails, we fall back to the login gate.
  const anonAllowed = process.env.ALLOW_ANON === "true";
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (!user && anonAllowed && !isPublicPath(pathname) && !isAdminPath) {
    const { error } = await supabase.auth.signInAnonymously();
    if (!error) {
      // Anonymous session cookie was set via setAll above — continue to the page.
      return supabaseResponse;
    }
    // Anonymous sign-in not enabled on the project yet → fall through to the login gate.
  }

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAdminPath) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!profile?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/portfolio";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
