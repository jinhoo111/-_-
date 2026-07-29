import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Signup/reset-password emails point here via emailRedirectTo/redirectTo.
// Exchanges the PKCE code for a session, then forwards to `next` (defaults
// to the app root) or back to login with an error if the code is invalid/expired.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/portfolio";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.warn("[auth/callback] exchange failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
