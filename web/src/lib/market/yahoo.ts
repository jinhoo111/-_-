export type YahooQuote = {
  price: number;
  changePercent: number | null;
  state: string;
};

export const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; RichHub/1.0)",
  Accept: "application/json, text/plain, */*",
};

// query1 -> query2 fallback per symbol. v7/finance/quote (batch) is permanently
// broken (401, requires cookie/crumb auth) — do not reintroduce it.
export async function fetchYahooQuote(symbol: string): Promise<YahooQuote | null> {
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
      if (state === "PRE" && meta.preMarketPrice) {
        price = meta.preMarketPrice;
      } else if (state === "POST" && meta.postMarketPrice) {
        price = meta.postMarketPrice;
      }
      if (price == null) continue;

      const prev = meta.previousClose ?? meta.chartPreviousClose;
      const changePercent = prev ? ((price - prev) / prev) * 100 : null;
      return { price, changePercent, state };
    } catch {
      // try next host
    }
  }
  return null;
}

export interface DailyCandles {
  closes: number[];
  highs: number[];
  lows: number[];
  volumes: number[];
}

// 1y daily OHLCV candles (Yahoo v8 chart), for the tech-signal scanner. Aligned arrays:
// null closes are dropped and the sibling values shifted accordingly (legacy behavior).
export async function fetchYahooDailyCandles(symbol: string): Promise<DailyCandles | null> {
  for (const host of ["query1", "query2"]) {
    try {
      const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1y`;
      const res = await fetch(url, { headers: YAHOO_HEADERS, signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const r = (await res.json())?.chart?.result?.[0];
      if (!r) continue;
      const q = r.indicators?.quote?.[0] || {};
      const cl = q.close || [];
      const hi = q.high || [];
      const lo = q.low || [];
      const vo = q.volume || [];
      const closes: number[] = [];
      const highs: number[] = [];
      const lows: number[] = [];
      const volumes: number[] = [];
      for (let i = 0; i < cl.length; i++) {
        if (cl[i] != null) {
          closes.push(cl[i]);
          highs.push(hi[i] ?? cl[i]);
          lows.push(lo[i] ?? cl[i]);
          volumes.push(vo[i] ?? 0);
        }
      }
      if (closes.length >= 20) return { closes, highs, lows, volumes };
    } catch {
      // try next host
    }
  }
  return null;
}
