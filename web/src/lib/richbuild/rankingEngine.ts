import { fetchYahooDailyCandles } from "@/lib/market/yahoo";
import { buildHeatIndexResult } from "@/lib/richbuild/indicatorEngine";
import { KR_RANKING_UNIVERSE, US_RANKING_UNIVERSE } from "@/lib/richbuild/rankingUniverse";
import type { Market, RankingRow } from "@/lib/richbuild/types";

const UNIVERSE: Record<Market, { symbol: string; name: string }[]> = {
  kr: KR_RANKING_UNIVERSE,
  us: US_RANKING_UNIVERSE,
};

// Daily-batch ranking (spec §5/§8: Top 10 guest / Top 50 member, not real-time).
// Scans the curated universe for one market, scores each by Attention Heat Index,
// and returns it sorted hottest-first — the caller decides how much of it to persist
// and how much to expose to guests vs. members.
export async function computeRanking(market: Market): Promise<RankingRow[]> {
  const universe = UNIVERSE[market];
  const results = await Promise.allSettled(
    universe.map(async ({ symbol, name }) => {
      const candles = await fetchYahooDailyCandles(symbol);
      if (!candles) return null;
      const { closes } = candles;
      const price = closes[closes.length - 1];
      const prev = closes[closes.length - 2];
      const changePct = prev ? ((price - prev) / prev) * 100 : null;
      const heat = buildHeatIndexResult(candles, market, new Date().toISOString().slice(0, 10));
      return { ticker: symbol, name, price, changePct, heatScore: heat.score };
    }),
  );

  const rows = results
    .filter((r): r is PromiseFulfilledResult<Omit<RankingRow, "rank"> | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is Omit<RankingRow, "rank"> => v != null)
    .sort((a, b) => b.heatScore - a.heatScore);

  return rows.map((row, i) => ({ ...row, rank: i + 1 }));
}
