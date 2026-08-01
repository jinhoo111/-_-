import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMonitorKrCompany } from "@/lib/monitor/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const corpCode = req.nextUrl.searchParams.get("corp_code") || "";
  if (!corpCode) return NextResponse.json({ error: "missing_corp_code" }, { status: 400 });

  try {
    const data = await getMonitorKrCompany(corpCode);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "company_unavailable" }, { status: 502 });
  }
}
