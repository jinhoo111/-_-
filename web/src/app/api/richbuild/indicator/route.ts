import { NextResponse, type NextRequest } from "next/server";
import { fetchYahooDailyCandles } from "@/lib/market/yahoo";
import { createClient } from "@/lib/supabase/server";
import { getFlowKrStock } from "@/lib/flow/server";
import { buildHeatIndexResult, buildStopLossResult } from "@/lib/richbuild/indicatorEngine";
import type { IndicatorResponse, Market } from "@/lib/richbuild/types";

// K1 (retail net-buy ratio, KR only, service plan §6.1): the doc's exact ratio is
// 개인순매수 ÷ 총거래대금 (retail net-buy value ÷ total trading value); Naver's flow
// endpoint (lib/flow/server.ts) gives net-buy in SHARES, not value, so this divides by
// the day's share volume instead — a proxy, not the literal spec ratio. K2 (KRX
// market-alert stage) is not attempted here at all — see indicatorEngine.ts's header.
async function fetchRetailNetBuyRatio(ticker: string, todaysVolume: number): Promise<number | null> {
  const code = ticker.replace(/\.(KS|KQ)$/i, "");
  if (code === ticker) return null; // not a KR ticker
  try {
    const flow = await getFlowKrStock(code);
    const latest = flow[0];
    if (!latest || !todaysVolume) return null;
    return latest.individual / todaysVolume;
  } catch {
    return null;
  }
}

// GET /api/richbuild/indicator?ticker=005930.KS&buyPrice=208500
// Daily-close-based only (spec §8: real-time is deliberately deferred — the underlying
// academic definitions are themselves daily-close-based).
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

  const market: Market = /\.(KS|KQ)$/i.test(ticker) ? "kr" : "us";

  // Loss Severity is gated behind registration, not just a buy price (spec §7 #4) —
  // this is the server-side check; the client can't be trusted to self-report auth state.
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const unlocked = Boolean(authData.user);

  const asOfDate = new Date().toISOString().slice(0, 10);
  const price = candles.closes[candles.closes.length - 1];
  const todaysVolume = candles.volumes[candles.volumes.length - 1];
  const retailNetBuyRatio = market === "kr" ? await fetchRetailNetBuyRatio(ticker, todaysVolume) : null;

  const body: IndicatorResponse = {
    ticker,
    price,
    history: candles.closes.slice(-63), // ~3 months of trading days, for the trend chart
    stopLoss: buildStopLossResult(candles, buyPrice, unlocked, asOfDate),
    heat: buildHeatIndexResult(candles, market, asOfDate, { retailNetBuyRatio }),
  };
  return NextResponse.json(body);
}
