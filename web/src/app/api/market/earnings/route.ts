import { NextResponse, type NextRequest } from "next/server";
import { cacheGet, cacheSet } from "@/lib/flow/cache";

// Live US earnings-calendar markers for the journal calendar — ported from legacy
// `fh-call calendar/earnings`. KR symbols are skipped (no Finnhub KR coverage).
const FINNHUB_BASE = "https://finnhub.io/api/v1";
const EARNINGS_TTL_MS = 6 * 3600_000; // 6h (legacy US earnings cache)

export interface EarningsRow {
  date: string;
  epsActual: number | null;
  epsEstimate: number | null;
  period: string;
}

interface FinnhubEarningsRow {
  date?: string;
  period?: string;
  epsActual?: number | null;
  epsEstimate?: number | null;
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("symbols") || "";
  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s && !/\.(KS|KQ)$/i.test(s))
    .slice(0, 50);
  const results: Record<string, EarningsRow[]> = {};
  if (!symbols.length) return NextResponse.json({ results });

  const key = process.env.OWNER_FINNHUB_KEY;
  if (!key) return NextResponse.json({ results });

  for (const symbol of symbols) {
    const cacheKey = `earnings:${symbol}`;
    try {
      const cached = await cacheGet(cacheKey, EARNINGS_TTL_MS);
      if (cached) {
        results[symbol] = cached as EarningsRow[];
        continue;
      }
      const qs = new URLSearchParams({ symbol, token: key });
      const r = await fetch(`${FINNHUB_BASE}/calendar/earnings?${qs}`, { signal: AbortSignal.timeout(10_000) });
      if (!r.ok) continue;
      const data = await r.json();
      const rawCalendar = (data as { earningsCalendar?: FinnhubEarningsRow[] } | null)?.earningsCalendar ?? [];
      const items: EarningsRow[] = rawCalendar
        .map((e) => ({
          date: String(e.date ?? ""),
          epsActual: e.epsActual != null ? Number(e.epsActual) : null,
          epsEstimate: e.epsEstimate != null ? Number(e.epsEstimate) : null,
          period: String(e.period ?? ""),
        }))
        .filter((e) => e.date);
      results[symbol] = items;
      await cacheSet(cacheKey, items);
    } catch {
      // skip failing symbols
    }
  }
  return NextResponse.json({ results });
}
