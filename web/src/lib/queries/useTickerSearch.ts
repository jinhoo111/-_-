"use client";

import { useEffect, useMemo, useState } from "react";
import { searchLocalTickers, type TickerSearchResult } from "@/lib/portfolio/constants";

async function fetchRemote(query: string): Promise<TickerSearchResult[]> {
  try {
    const res = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(4500) });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.results) ? data.results : [];
  } catch {
    return [];
  }
}

// Mirrors legacy tickerSearchInput: local dictionary shows instantly, then a
// 350ms-debounced server search (Naver for Korean queries, Yahoo otherwise)
// replaces it once it resolves for the current query.
export function useTickerSearch(query: string) {
  const q = query.trim();
  const local = useMemo(() => searchLocalTickers(q), [q]);
  const [remote, setRemote] = useState<{ query: string; results: TickerSearchResult[] }>({ query: "", results: [] });

  useEffect(() => {
    if (!q) return;
    const timer = setTimeout(async () => {
      const results = await fetchRemote(q);
      setRemote({ query: q, results });
    }, 350);
    return () => clearTimeout(timer);
  }, [q]);

  return remote.query === q && remote.results.length ? remote.results : local;
}
