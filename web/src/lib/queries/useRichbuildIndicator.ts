"use client";

import { useQuery } from "@tanstack/react-query";
import type { IndicatorResponse } from "@/lib/richbuild/types";

async function fetchIndicator(ticker: string, buyPrice: number | null): Promise<IndicatorResponse> {
  const params = new URLSearchParams({ ticker });
  if (buyPrice != null) params.set("buyPrice", String(buyPrice));
  const res = await fetch(`/api/richbuild/indicator?${params.toString()}`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error("indicator_unavailable");
  return res.json();
}

export function useRichbuildIndicator(ticker: string, buyPrice: number | null) {
  return useQuery({
    queryKey: ["richbuild_indicator", ticker, buyPrice],
    queryFn: () => fetchIndicator(ticker, buyPrice),
    enabled: Boolean(ticker),
    staleTime: 60_000,
  });
}
