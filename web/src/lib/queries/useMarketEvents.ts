"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/browser";
import { MARKET_EVENTS } from "@/lib/journal/constants";
import type { MarketEvent } from "@/lib/types/userData";

async function fetchSharedEvents(): Promise<MarketEvent[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("market_events").select("id,date,type,title");
    if (error) return [];
    return (data ?? []) as MarketEvent[];
  } catch {
    return [];
  }
}

// Merges the hand-maintained local calendar with admin-curated shared events.
// Live earnings markers are deferred to Phase 3 (blocked on proxy-api recovery).
export function useMarketEvents() {
  const { data } = useQuery({
    queryKey: ["market_events"],
    queryFn: fetchSharedEvents,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  return [...MARKET_EVENTS, ...(data ?? [])];
}
