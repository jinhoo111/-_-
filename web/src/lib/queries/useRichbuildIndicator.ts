"use client";

import { useQuery } from "@tanstack/react-query";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { IndicatorResponse } from "@/lib/richbuild/types";
import type { Lang } from "@/lib/i18n/messages";

async function fetchIndicator(ticker: string, buyPrice: number | null, lang: Lang): Promise<IndicatorResponse> {
  const params = new URLSearchParams({ ticker, lang });
  if (buyPrice != null) params.set("buyPrice", String(buyPrice));
  const res = await fetch(`/api/richbuild/indicator?${params.toString()}`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error("indicator_unavailable");
  return res.json();
}

export function useRichbuildIndicator(ticker: string, buyPrice: number | null) {
  const { lang } = useLang();
  return useQuery({
    queryKey: ["richbuild_indicator", ticker, buyPrice, lang],
    queryFn: () => fetchIndicator(ticker, buyPrice, lang),
    enabled: Boolean(ticker),
    staleTime: 60_000,
  });
}
