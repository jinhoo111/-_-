import { NextResponse, type NextRequest } from "next/server";
import { fetchYahooDailyCandles } from "@/lib/market/yahoo";
import { buildHeatIndexResult, buildStopLossResult } from "@/lib/richbuild/indicatorEngine";
import type { IndicatorResponse } from "@/lib/richbuild/types";

// GET /api/richbuild/indicator?ticker=005930.KS&buyPrice=208500
// Daily-close-based only (spec §8: real-time is deliberately deferred — the underlying
// academic definitions are themselves daily-close-based). News-volume and KR-only bonus
// signals (retail net-buy ratio, KRX market-alert) are not wired in yet — see
// indicatorEngine.ts's buildHeatIndexResult doc comment.
export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  const buyPriceParam = request.nextUrl.searchParams.get("buyPrice");
  if (!ticker) return NextResponse.json({ error: "ticker_required" }, { status: 400 });

  const buyPrice = buyPriceParam ? Number(buyPriceParam) : null;
  if (buyPriceParam && (!Number.isFinite(buyPrice) || (buyPrice as number) <= 0)) {
    return NextResponse.json({ error: "invalid_buy_price" }, { status: 400 });
  }

  const candles = await fetchYahooDailyCandles(ticker);
  if (!candles) return NextResponse.json({ error: "data_unavailable" }, { status: 502 });

  const asOfDate = new Date().toISOString().slice(0, 10);
  const price = candles.closes[candles.closes.length - 1];

  const body: IndicatorResponse = {
    ticker,
    price,
    stopLoss: buildStopLossResult(candles, buyPrice, asOfDate),
    heat: buildHeatIndexResult(candles, asOfDate),
  };
  return NextResponse.json(body);
}
