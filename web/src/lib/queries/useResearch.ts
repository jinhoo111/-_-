"use client";

import { useQuery } from "@tanstack/react-query";
import type { RssItem } from "@/lib/news/constants";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`research_fetch_failed:${url}`);
  return res.json();
}

export function useRegFeeds() {
  return useQuery({
    queryKey: ["research", "reg-feeds"],
    queryFn: () => fetchJson<{ us: RssItem[]; kr: RssItem[]; builtAt: string }>("/api/research/reg-feeds"),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useRegSearch(keyword: string | null) {
  return useQuery({
    queryKey: ["research", "reg-search", keyword],
    queryFn: () => fetchJson<{ items: RssItem[] }>(`/api/research/reg-search?q=${encodeURIComponent(keyword ?? "")}`),
    enabled: !!keyword && keyword.trim().length > 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
