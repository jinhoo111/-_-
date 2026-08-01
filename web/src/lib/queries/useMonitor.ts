"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { MonitorKrBundle, MonitorUsBundle, ResolvedCompany } from "@/lib/monitor/server";
import type { SignalCategory } from "@/lib/monitor/constants";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`monitor_fetch_failed:${url}`);
  return res.json();
}

export function useMonitorResolve(q: string | null) {
  return useQuery({
    queryKey: ["monitor", "resolve", q],
    queryFn: () => fetchJson<ResolvedCompany>(`/api/monitor/resolve?q=${encodeURIComponent(q || "")}`),
    enabled: !!q && q.trim().length > 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useMonitorCompany(corpCode: string | null) {
  return useQuery({
    queryKey: ["monitor", "company", corpCode],
    queryFn: () => fetchJson<MonitorKrBundle>(`/api/monitor/company?corp_code=${corpCode}`),
    enabled: !!corpCode,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useMonitorUs(ticker: string | null, cik: string | null) {
  return useQuery({
    queryKey: ["monitor", "us", ticker, cik],
    queryFn: () => fetchJson<MonitorUsBundle>(`/api/monitor/us?ticker=${ticker}&cik=${cik}`),
    enabled: !!ticker && !!cik,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useMonitorBrief() {
  return useMutation({
    mutationFn: async (input: { corp_name: string; stock_code: string; report_nm: string; category: SignalCategory }) => {
      const res = await fetch("/api/monitor/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "brief_failed");
      }
      return res.json() as Promise<{ text: string }>;
    },
  });
}
