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
