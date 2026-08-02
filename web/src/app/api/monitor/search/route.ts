import { NextResponse, type NextRequest } from "next/server";

// Public typeahead endpoint (no auth) — mirrors legacy's monitorSearchInput/_monitorNaverSearch.
// Only surfaces KR-listed suggestions (DART covers domestic disclosures only); US tickers are
// resolved directly via /api/monitor/resolve without a suggestion list, same as legacy.
export type MonitorSearchSuggestion = {
  code: string;
  name: string;
  mkt: string;
};

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ results: [] });

  try {
    const res = await fetch(`https://ac.stock.naver.com/ac?q=${encodeURIComponent(q)}&target=stock`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RichHub/1.0)", Accept: "application/json, text/plain, */*" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return NextResponse.json({ results: [] });
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    const results: MonitorSearchSuggestion[] = [];
    for (const it of items) {
      const nation = String(it.nationCode || "").toUpperCase();
      if (nation !== "KOR") continue; // DART covers domestic stocks only
      const type = String(it.typeCode || "").toUpperCase();
      results.push({ code: it.code, name: it.name || it.code, mkt: type || "KOSPI" });
      if (results.length >= 8) break;
    }
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
