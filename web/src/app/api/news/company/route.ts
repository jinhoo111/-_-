import { NextResponse, type NextRequest } from "next/server";
import { getCompanyNews } from "@/lib/news/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol_required" }, { status: 400 });
  try {
    const items = await getCompanyNews(symbol);
    return NextResponse.json({ symbol, items });
  } catch {
    return NextResponse.json({ error: "news_unavailable" }, { status: 502 });
  }
}
