"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

// ── Admin composer (security page) ──
// Mirrors legacy adminAddMarketEvent/adminDeleteMarketEvent (index.html ~4812-4841):
// world-readable rows, writes gated by RLS to admins only (see market_events table policy).

const ADMIN_MARKET_EVENTS_KEY = ["admin", "market_events"];

export interface AdminMarketEvent {
  id: number;
  date: string;
  type: string;
  title: string;
}

export function useAdminMarketEvents() {
  return useQuery({
    queryKey: ADMIN_MARKET_EVENTS_KEY,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("market_events")
        .select("id,date,type,title")
        .order("id", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminMarketEvent[];
    },
  });
}

export function useAddMarketEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: { date: string; type: string; title: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from("market_events").insert(event);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MARKET_EVENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["market_events"] });
    },
  });
}

export function useDeleteMarketEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const supabase = createClient();
      const { error } = await supabase.from("market_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MARKET_EVENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["market_events"] });
    },
  });
}
