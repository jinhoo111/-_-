"use client";

import { useQuery } from "@tanstack/react-query";
import type { F13Response, FlowKrRank, FlowKrStockPoint, InsiderTx } from "@/lib/flow/constants";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`flow_fetch_failed:${url}`);
  return res.json();
}

export function useFlowKrRank(enabled: boolean = true) {
  return useQuery({
    queryKey: ["flow", "kr-rank"],
    queryFn: () => fetchJson<FlowKrRank>("/api/flow/kr-rank"),
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useFlowKrStock(code: string | null) {
  return useQuery({
    queryKey: ["flow", "kr-stock", code],
    queryFn: () => fetchJson<{ code: string; rows: FlowKrStockPoint[] }>(`/api/flow/kr-stock?code=${code}`),
    enabled: !!code,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useInsiderLatest(enabled: boolean = true) {
  return useQuery({
    queryKey: ["flow", "insider-latest"],
    queryFn: () => fetchJson<{ builtAt: string; rows: InsiderTx[] }>("/api/flow/insider-latest"),
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useInsiderStock(ticker: string | null) {
  return useQuery({
    queryKey: ["flow", "insider-stock", ticker],
    queryFn: () => fetchJson<{ ticker: string; builtAt: string; rows: InsiderTx[] }>(`/api/flow/insider-stock?ticker=${ticker}`),
    enabled: !!ticker,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function use13fList() {
  return useQuery({
    queryKey: ["flow", "13f-list"],
    queryFn: () => fetchJson<{ id: string; name: string; who: string }[]>("/api/flow/13f-list"),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function use13f(id: string | null) {
  return useQuery({
    queryKey: ["flow", "13f", id],
    queryFn: () => fetchJson<F13Response>(`/api/flow/13f?id=${id}`),
    enabled: !!id,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
