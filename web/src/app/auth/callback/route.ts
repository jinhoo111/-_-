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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // RichBuild's working-flow diagram (§4) fires signup_completed at guest→member
      // conversion, including via Google — this is the only place that path lands
      // server-side. Heuristic: a user created in the last 20s is a fresh signup, not
      // a returning login (Supabase has no direct "was this a new user" flag here).
      if (next.startsWith("/home") && data.user) {
        const createdMs = new Date(data.user.created_at).getTime();
        if (Date.now() - createdMs < 20_000) {
          await supabase
            .from("richbuild_events")
            .insert({ visitor_id: data.user.id, event: "signup_completed" })
            .then(undefined, () => {}); // best-effort — e.g. migration 0015 not applied yet
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.warn("[auth/callback] exchange failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
