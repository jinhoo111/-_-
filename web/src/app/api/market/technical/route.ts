import { NextResponse, type NextRequest } from "next/server";
import { fetchYahooDailyCandles } from "@/lib/market/yahoo";
import { computeTechnicals, rsi14, calculateMFI } from "@/lib/market/technical";

// Ported from legacy scanTechSignals: fetch 1y daily candles per eligible holding and
// compute MA-cross / 52-week-high / disparity signals + RSI/MFI values. Grade classification
// (with leveraged-ETF thresholds) happens client-side so the stock NAME is available.
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("symbols") || "";
  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 50);
  if (!symbols.length) return NextResponse.json({ error: "symbols_required" }, { status: 400 });

  const results: Record<string, { signals: ReturnType<typeof computeTechnicals>; rsi: number | null; mfi: number | null }> = {};
  await Promise.all(
    symbols.map(async (ticker) => {
      try {
        const c = await fetchYahooDailyCandles(ticker);
        if (!c) return;
        const candles = c.closes.map((cl, i) => ({ h: c.highs[i], l: c.lows[i], c: cl, v: c.volumes[i] }));
        results[ticker] = {
          signals: computeTechnicals(c.closes, c.highs),
          rsi: rsi14(c.closes),
          mfi: calculateMFI(candles, 14),
        };
      } catch {
        // skip failing symbols — partial results are fine
      }
    }),
  );
  return NextResponse.json({ results });
}
