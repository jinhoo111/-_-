import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveCompany } from "@/lib/monitor/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json({ error: "missing_query" }, { status: 400 });

  try {
    const result = await resolveCompany(q);
    if (!result) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "resolve_failed" }, { status: 502 });
  }
}
