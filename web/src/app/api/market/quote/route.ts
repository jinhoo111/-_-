import { NextResponse, type NextRequest } from "next/server";

type Quote = {
  price: number;
  changePercent: number | null;
  state: string;
  stateLabel: string;
};

const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; RichHub/1.0)",
  Accept: "application/json, text/plain, */*",
};

function isKrTicker(symbol: string): boolean {
  return /\.(KS|KQ)$/i.test(symbol);
}

// Naver first for KR tickers (accurate same-day close, no Yahoo proxy load),
// falling back to Yahoo's chart endpoint like the rest of this route.
async function fetchNaverQuote(symbol: string): Promise<Quote | null> {
  const code = symbol.replace(/\.(KS|KQ)$/i, "");
  try {
    const res = await fetch(`https://m.stock.naver.com/api/stock/${code}/basic`, {
      headers: YAHOO_HEADERS,
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return null;
    const d = await res.json();
    const raw = d?.closePrice;
    const price = typeof raw === "string" ? parseFloat(raw.replace(/,/g, "")) : Number(raw);
    if (!(price > 0)) return null;
    // Naver's fluctuationsRatio already carries its sign — do not re-apply direction.
    const ratio = parseFloat(d.fluctuationsRatio || "0");
    const flat = d.compareToPreviousPrice?.code === "3";
    const isOpen = d.marketStatus === "OPEN";
    return { price, changePercent: flat ? 0 : ratio, state: isOpen ? "REGULAR" : "CLOSED", stateLabel: isOpen ? "지연" : "종가" };
  } catch {
    return null;
  }
}

// query1 -> query2 fallback per symbol. v7/finance/quote (batch) is permanently
// broken (401, requires cookie/crumb auth) — do not reintroduce it.
async function fetchYahooQuote(symbol: string): Promise<Quote | null> {
  for (const host of ["query1", "query2"]) {
    try {
      const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=2m&range=1d&includePrePost=true`;
      const res = await fetch(url, { headers: YAHOO_HEADERS, signal: AbortSignal.timeout(7000) });
      if (!res.ok) continue;
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta) continue;

      const state = meta.marketState || "CLOSED";
      let price = meta.regularMarketPrice;
      let stateLabel = "종가";
      if (state === "PRE" && meta.preMarketPrice) {
        price = meta.preMarketPrice;
        stateLabel = "프리";
      } else if (state === "POST" && meta.postMarketPrice) {
        price = meta.postMarketPrice;
        stateLabel = "애프터";
      } else if (state === "REGULAR") {
        stateLabel = "지연";
      }
      if (price == null) continue;

      const prev = meta.previousClose ?? meta.chartPreviousClose;
      const changePercent = prev ? ((price - prev) / prev) * 100 : null;
      return { price, changePercent, state, stateLabel };
    } catch {
      // try next host
    }
  }
  return null;
}

async function fetchQuote(symbol: string): Promise<Quote | null> {
  if (isKrTicker(symbol)) {
    const naver = await fetchNaverQuote(symbol);
    if (naver) return naver;
  }
  return fetchYahooQuote(symbol);
}

export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get("symbols") || "";
  const symbols = [...new Set(symbolsParam.split(",").map((s) => s.trim()).filter(Boolean))];
  if (!symbols.length) return NextResponse.json({ error: "symbols_required" }, { status: 400 });
  if (symbols.length > 50) return NextResponse.json({ error: "too_many_symbols" }, { status: 400 });

  const results = await Promise.allSettled(symbols.map((s) => fetchQuote(s).then((q) => [s, q] as const)));
  const quotes: Record<string, Quote | null> = {};
  for (const r of results) {
    if (r.status === "fulfilled") quotes[r.value[0]] = r.value[1];
  }
  return NextResponse.json(quotes);
}
