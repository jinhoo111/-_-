import { KR_TICKER_MAP, US_TICKER_MAP } from "@/lib/portfolio/constants";

// Candidate universe for the daily ranking batch — the spec doesn't define an
// exact universe (that's presumably in indicator_spec_richbuild.md §4/§5.4, which
// isn't available), so this reuses the same curated liquid-name dictionaries the
// portfolio ticker search already ships with, deduped by symbol.
function dedupedSymbols(map: Record<string, string>): { symbol: string; name: string }[] {
  const seen = new Set<string>();
  const out: { symbol: string; name: string }[] = [];
  for (const [name, symbol] of Object.entries(map)) {
    if (seen.has(symbol)) continue;
    seen.add(symbol);
    out.push({ symbol, name });
  }
  return out;
}

export const KR_RANKING_UNIVERSE = dedupedSymbols(KR_TICKER_MAP);
export const US_RANKING_UNIVERSE = dedupedSymbols(US_TICKER_MAP);
