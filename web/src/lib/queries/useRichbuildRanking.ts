"use client";

import { useQuery } from "@tanstack/react-query";
import type { Market } from "@/lib/richbuild/types";
import type { RankingRow } from "@/lib/richbuild/types";

async function fetchRanking(market: Market, depth: "guest" | "member"): Promise<RankingRow[]> {
  const res = await fetch(`/api/richbuild/ranking?market=${market}&depth=${depth}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.rows) ? data.rows : [];
}

export function useRichbuildRanking(market: Market, depth: "guest" | "member") {
  return useQuery({
    queryKey: ["richbuild_ranking", market, depth],
    queryFn: () => fetchRanking(market, depth),
    staleTime: 5 * 60_000,
  });
}
