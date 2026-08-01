import { NextResponse, type NextRequest } from "next/server";
import { regKeywordUrls } from "@/lib/news/constants";
import { fetchRssXml, parseRssItems } from "@/lib/news/server";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("q")?.trim();
  if (!keyword) return NextResponse.json({ error: "q_required" }, { status: 400 });

  const urls = regKeywordUrls(keyword);
  const [kr, us] = await Promise.allSettled([
    fetchRssXml(urls.kr).then((xml) => parseRssItems(xml, "kr-search")),
    fetchRssXml(urls.us).then((xml) => parseRssItems(xml, "us-search")),
  ]);
  const items = [...(kr.status === "fulfilled" ? kr.value : []), ...(us.status === "fulfilled" ? us.value : [])];
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return NextResponse.json({ items });
}
