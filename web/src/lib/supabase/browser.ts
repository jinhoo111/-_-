import { createBrowserClient } from "@supabase/ssr";

// Anon key only — safe to ship to the browser, RLS enforces access.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
