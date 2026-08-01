import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { briefSignal } from "@/lib/monitor/server";
import { SIGNAL_CATS, type SignalCategory } from "@/lib/monitor/constants";

// AI briefing is Pro-gated real functionality — the client's Pro flag is UI-only,
// this route re-checks business_approved/is_admin server-side before calling Gemini.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_admin, business_approved")
    .eq("user_id", user.id)
    .single();

  if (!profile?.is_admin && !profile?.business_approved) {
    return NextResponse.json({ error: "pro_required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const corpName = body?.corp_name;
  const stockCode = body?.stock_code;
  const reportNm = body?.report_nm;
  const category = body?.category as SignalCategory | undefined;
  if (!corpName || !reportNm) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const categoryLabel = category ? SIGNAL_CATS[category]?.labelKey ?? "" : "";
  const result = await briefSignal(corpName, stockCode || "", reportNm, categoryLabel);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: result.reason === "no_key" ? 503 : 502 });
  }
  return NextResponse.json({ text: result.text });
}
