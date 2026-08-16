import { NextResponse, type NextRequest } from "next/server";
import { fetchYahooHistorySeries } from "@/lib/market/yahoo";

// Real historical close series per symbol for the indices sparklines.
// GET /api/market/history?symbols=^KS11,^GSPC&range=1M  →  { "^KS11": number[] | null, ... }
export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get("symbols") || "";
  const range = request.nextUrl.searchParams.get("range") || "1M";
  const symbols = [...new Set(symbolsParam.split(",").map((s) => s.trim()).filter(Boolean))];
  if (!symbols.length) return NextResponse.json({ error: "symbols_required" }, { status: 400 });
  if (symbols.length > 50) return NextResponse.json({ error: "too_many_symbols" }, { status: 400 });

  const results = await Promise.allSettled(
    symbols.map(async (s) => [s, await fetchYahooHistorySeries(s, range)] as const),
  );
  const out: Record<string, number[] | null> = {};
  for (const r of results) {
    if (r.status === "fulfilled") out[r.value[0]] = r.value[1];
  }
  return NextResponse.json(out);
}
