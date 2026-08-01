import { NextResponse } from "next/server";

type CryptoQuote = {
  price: number;
  changePercent: number | null;
};

const COINGECKO_IDS = ["bitcoin", "ethereum", "solana", "binancecoin"];

export async function GET() {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_IDS.join(",")}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return NextResponse.json({});
    const data = await res.json();

    const quotes: Record<string, CryptoQuote | null> = {};
    for (const id of COINGECKO_IDS) {
      const price = data?.[id]?.usd;
      const changePercent = data?.[id]?.usd_24h_change;
      quotes[id] = typeof price === "number" ? { price, changePercent: typeof changePercent === "number" ? changePercent : null } : null;
    }
    return NextResponse.json(quotes);
  } catch {
    return NextResponse.json({});
  }
}
