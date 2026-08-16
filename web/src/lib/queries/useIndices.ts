"use client";

import { useQuery } from "@tanstack/react-query";

export type CryptoQuote = {
  price: number;
  changePercent: number | null;
};

async function fetchCrypto(): Promise<Record<string, CryptoQuote | null>> {
  const res = await fetch("/api/market/crypto");
  if (!res.ok) throw new Error("crypto_fetch_failed");
  return res.json();
}

export function useCrypto(enabled: boolean) {
  return useQuery({
    queryKey: ["crypto"],
    queryFn: fetchCrypto,
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export type FxRates = {
  KRW: number | null;
  JPY: number | null;
  EUR: number | null;
  CNY: number | null;
};

async function fetchFxRates(): Promise<FxRates> {
  const res = await fetch("/api/market/fx");
  if (!res.ok) throw new Error("fx_fetch_failed");
  return res.json();
}

// Distinct from useFxRate() in useQuotes.ts (a single USD/KRW number consumed by
// Portfolio) — this returns all four Indices FX pairs from the server-side proxy.
export function useFxRates(enabled: boolean) {
  return useQuery({
    queryKey: ["fxRates"],
    queryFn: fetchFxRates,
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

async function fetchHistory(symbols: string[], range: string): Promise<Record<string, number[] | null>> {
  const res = await fetch(`/api/market/history?symbols=${encodeURIComponent(symbols.join(","))}&range=${range}`);
  if (!res.ok) throw new Error("history_fetch_failed");
  return res.json();
}

// Real daily close series per symbol for the indices sparklines (1W/1M/3M/1Y).
// Refetched when the range tab changes; kept fresh for a few minutes.
export function useHistory(symbols: string[], range: string) {
  const key = [...new Set(symbols)].sort();
  return useQuery({
    queryKey: ["history", key, range],
    queryFn: () => fetchHistory(key, range),
    enabled: key.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
