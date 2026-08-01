import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMonitorUsCompany } from "@/lib/monitor/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ticker = req.nextUrl.searchParams.get("ticker") || "";
  const cik = req.nextUrl.searchParams.get("cik") || "";
  if (!ticker || !cik) return NextResponse.json({ error: "missing_params" }, { status: 400 });

  try {
    const data = await getMonitorUsCompany(ticker, cik);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "company_unavailable" }, { status: 502 });
  }
}
