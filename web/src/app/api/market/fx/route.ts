import { NextResponse } from "next/server";
import { fetchYahooQuote } from "@/lib/market/yahoo";

type FxRates = {
  KRW: number | null;
  JPY: number | null;
  EUR: number | null;
  CNY: number | null;
};

export async function GET() {
  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD", { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error("exchangerate_api_failed");
    const data = await res.json();
    const rates: FxRates = {
      KRW: data.rates?.KRW ?? null,
      JPY: data.rates?.JPY ?? null,
      // EUR/USD is quoted the other way round from exchangerate-api's USD-base rates.
      EUR: data.rates?.EUR ? 1 / data.rates.EUR : null,
      CNY: data.rates?.CNY ?? null,
    };
    return NextResponse.json(rates);
  } catch {
    // exchangerate-api down — fall back to Yahoo for KRW only (mirrors legacy updateFxRate).
    const krw = await fetchYahooQuote("KRW=X");
    return NextResponse.json({ KRW: krw?.price ?? null, JPY: null, EUR: null, CNY: null } satisfies FxRates);
  }
}
