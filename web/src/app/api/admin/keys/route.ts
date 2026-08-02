import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Proxies admin API-key management to the same Supabase Edge Function the legacy
// app calls directly (supabase/functions/market-data/index.ts). Action names mirror
// index.html's saveAdminDartKey/deleteAdminDartKey/saveAdminFinnhubKey/deleteAdminFinnhubKey
// (~index.html 2438-2516) and the Edge Function's own action handlers (~market-data/index.ts
// 249-321, 336-381). The Edge Function itself re-checks is_admin server-side and never
// returns raw key values (admin-keys-status, get-dart-key/get-fh-key return "use_server") —
// this route just forwards the user's own JWT so that check applies unchanged.

const ALLOWED_ACTIONS = new Set([
  "admin-keys-status",
  "store-dart-key",
  "delete-dart-key",
  "admin-save-finnhub-key",
  "admin-delete-finnhub-key",
]);

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (!action || !ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: "action_not_allowed" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/market-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!res) return NextResponse.json({ error: "network" }, { status: 502 });
  const data = await res.json().catch(() => ({ error: "bad_response" }));
  return NextResponse.json(data, { status: res.status });
}
