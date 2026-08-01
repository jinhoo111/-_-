import { NextResponse, type NextRequest } from "next/server";
import { getNaverStockNews } from "@/lib/news/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code || !/^\d{6}$/.test(code)) return NextResponse.json({ error: "code_required" }, { status: 400 });
  try {
    const data = await getNaverStockNews(code);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "naver_news_unavailable" }, { status: 502 });
  }
}
