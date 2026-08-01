"use client";

import { useQuery } from "@tanstack/react-query";
import type { NewsItem } from "@/lib/news/constants";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`news_fetch_failed:${url}`);
  return res.json();
}

export function useMarketNews(category: string) {
  return useQuery({
    queryKey: ["news", "market", category],
    queryFn: () => fetchJson<{ items: NewsItem[] }>(`/api/news/market?category=${category}`),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useCompanyNews(symbol: string | null) {
  return useQuery({
    queryKey: ["news", "company", symbol],
    queryFn: () => fetchJson<{ symbol: string; items: NewsItem[] }>(`/api/news/company?symbol=${symbol}`),
    enabled: !!symbol,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

interface AnalystRatingResponse {
  symbol: string;
  recommendation: { period: string; strongBuy: number; buy: number; hold: number; sell: number; strongSell: number }[];
  priceTarget: { targetHigh: number; targetLow: number; targetMean: number; targetMedian: number } | null;
}

export function useAnalystRating(symbol: string | null) {
  return useQuery({
    queryKey: ["news", "rating", symbol],
    queryFn: () => fetchJson<AnalystRatingResponse>(`/api/news/rating?symbol=${symbol}`),
    enabled: !!symbol,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useNaverStockNews(code: string | null) {
  return useQuery({
    queryKey: ["news", "naver", code],
    queryFn: () => fetchJson<unknown>(`/api/news/naver?code=${code}`),
    enabled: !!code && /^\d{6}$/.test(code),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
