"use client";

import { useQuery } from "@tanstack/react-query";
import { isKrTicker } from "@/lib/types/userData";
import type { EarningsRow } from "@/app/api/market/earnings/route";

// Live US earnings-calendar markers for the journal calendar (user's holdings).
export function useEarningsMarkers(symbols: string[]) {
  const usSymbols = [...new Set(symbols.filter((s) => s && !isKrTicker(s)))];
  return useQuery({
    queryKey: ["earnings", usSymbols],
    queryFn: async () => {
      if (!usSymbols.length) return {} as Record<string, EarningsRow[]>;
      const res = await fetch(`/api/market/earnings?symbols=${encodeURIComponent(usSymbols.join(","))}`);
      if (!res.ok) throw new Error("earnings_fetch_failed");
      const data = await res.json();
      return (data?.results ?? {}) as Record<string, EarningsRow[]>;
    },
    enabled: usSymbols.length > 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
