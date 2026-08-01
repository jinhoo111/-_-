import { NextResponse, type NextRequest } from "next/server";
import { YAHOO_HEADERS } from "@/lib/market/yahoo";

export type TickerSearchResult = {
  symbol: string;
  name: string;
  market: "kr" | "us";
};

async function searchNaver(query: string): Promise<TickerSearchResult[]> {
  const res = await fetch(`https://ac.stock.naver.com/ac?q=${encodeURIComponent(query)}&target=stock,index`, {
    headers: YAHOO_HEADERS,
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  const results: TickerSearchResult[] = [];
  for (const it of items) {
    const nation = String(it.nationCode || "").toUpperCase();
    const type = String(it.typeCode || "").toUpperCase();
    if (nation === "KOR") {
      const suffix = type === "KOSDAQ" ? ".KQ" : ".KS";
      results.push({ symbol: it.code + suffix, name: it.name || it.code, market: "kr" });
    } else if (nation === "USA") {
      results.push({ symbol: it.code, name: it.name || it.code, market: "us" });
    }
    if (results.length >= 8) break;
  }
  return results;
}

function isKrTicker(symbol: string): boolean {
  return /\.(KS|KQ)$/i.test(symbol);
}

async function searchYahoo(query: string): Promise<TickerSearchResult[]> {
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&region=US&quotesCount=6&newsCount=0&listsCount=0`;
  const res = await fetch(url, { headers: YAHOO_HEADERS, signal: AbortSignal.timeout(4000) });
  if (!res.ok) return [];
  const data = await res.json();
  const quotes = (data?.quotes || []).filter((x: { quoteType?: string }) => x.quoteType === "EQUITY" || x.quoteType === "ETF").slice(0, 6);
  return quotes.map((x: { symbol: string; shortname?: string; longname?: string }) => ({
    symbol: x.symbol,
    name: x.shortname || x.longname || x.symbol,
    market: isKrTicker(x.symbol) ? "kr" : "us",
  }));
}

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") || "").trim();
  if (!query) return NextResponse.json({ results: [] });

  const isKo = /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(query);
  try {
    const results = isKo ? await searchNaver(query) : await searchYahoo(query);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
