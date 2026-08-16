"use client";

import { useQuery } from "@tanstack/react-query";

export type Quote = {
  price: number;
  changePercent: number | null;
  state: string;
};

async function fetchQuotes(symbols: string[]): Promise<Record<string, Quote | null>> {
  const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(symbols.join(","))}`);
  if (!res.ok) throw new Error("quote_fetch_failed");
  return res.json();
}

// One request for every distinct ticker on the page, refetched only on demand
// (manual refresh button) — avoids hammering Yahoo/Naver on every render.
export function useQuotes(symbols: string[]) {
  const key = [...new Set(symbols)].sort();
  return useQuery({
    queryKey: ["quotes", key],
    queryFn: () => fetchQuotes(key),
    enabled: key.length > 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

async function fetchFxRate(): Promise<number> {
  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    const rate = data?.rates?.KRW;
    if (rate) return rate;
  } catch {
    // fall through to Yahoo fallback below
  }
  const quotes = await fetchQuotes(["KRW=X"]);
  const price = quotes["KRW=X"]?.price;
  return price || 1400;
}

export function useFxRate() {
  return useQuery({ queryKey: ["fxRate"], queryFn: fetchFxRate, staleTime: Infinity });
}

async function fetchPortfolioHistory(symbols: string[], range: string): Promise<Record<string, number[] | null>> {
  const res = await fetch(`/api/market/history?symbols=${encodeURIComponent(symbols.join(","))}&range=${encodeURIComponent(range)}`);
  if (!res.ok) throw new Error("history_fetch_failed");
  return res.json();
}

// Real daily/intraday close series per held ticker for the portfolio hero chart.
// Refetched when the range dropdown changes; kept fresh for a few minutes.
export function usePortfolioHistory(symbols: string[], range: string) {
  const key = [...new Set(symbols)].sort();
  return useQuery({
    queryKey: ["portfolioHistory", key, range],
    queryFn: () => fetchPortfolioHistory(key, range),
    enabled: key.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
