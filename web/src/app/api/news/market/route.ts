import { NextResponse, type NextRequest } from "next/server";
import { getMarketNews } from "@/lib/news/server";

const ALLOWED = new Set(["general", "forex", "crypto", "merger"]);

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") || "general";
  if (!ALLOWED.has(category)) return NextResponse.json({ error: "invalid_category" }, { status: 400 });
  try {
    const items = await getMarketNews(category);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "news_unavailable" }, { status: 502 });
  }
}
