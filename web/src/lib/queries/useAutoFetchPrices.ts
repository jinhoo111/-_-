"use client";

import { useEffect, useRef } from "react";
import { useUserData, useUpdateUserData } from "@/lib/queries/useUserData";
import { isKrTicker } from "@/lib/types/userData";

// Ported from legacy checkAndAutoFetch: once/day auto price refresh — US batch when the
// US close has happened (≥04:30 KST) and KR batch after the KR close (≥15:30 KST), each
// deduped by a localStorage date key. Runs every 60s while the app is open.
const US_DEDUP_KEY = "auto_fetch_us";
const KR_DEDUP_KEY = "auto_fetch_kr";

function kstNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useAutoFetchPrices() {
  const { data: userData } = useUserData();
  const updateUserData = useUpdateUserData();
  const updateRef = useRef(updateUserData);
  useEffect(() => {
    updateRef.current = updateUserData;
  }, [updateUserData]);

  useEffect(() => {
    const stocks = userData?.stocks ?? [];
    if (!stocks.length) return;
    const tickers = stocks.filter((s) => !s.hidden && s.ticker?.trim()).map((s) => s.ticker.trim());
    if (!tickers.length) return;

    let cancelled = false;

    async function run() {
      if (cancelled) return;
      const now = kstNow();
      const today = dateKey(now);
      const hourMin = now.getHours() * 60 + now.getMinutes();

      const usTickers = tickers.filter((t) => !isKrTicker(t));
      const krTickers = tickers.filter((t) => isKrTicker(t));

      let usDone = false;
      let krDone = false;
      try {
        usDone = localStorage.getItem(US_DEDUP_KEY) === today;
        krDone = localStorage.getItem(KR_DEDUP_KEY) === today;
      } catch {
        // storage unavailable — just run
      }

      const targets: string[] = [];
      if (usTickers.length && !usDone && hourMin >= 4 * 60 + 30) targets.push(...usTickers);
      if (krTickers.length && !krDone && hourMin >= 15 * 60 + 30) targets.push(...krTickers);
      if (!targets.length) return;

      let quotes: Record<string, { price: number; state?: string }> = {};
      try {
        const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(targets.join(","))}`);
        if (res.ok) quotes = await res.json();
      } catch {
        return;
      }

      const patchMap: Record<string, { price: number; state?: string }> = {};
      for (const tk of targets) {
        const q = quotes?.[tk];
        if (q?.price != null) patchMap[tk] = { price: q.price, state: q.state };
      }
      if (!Object.keys(patchMap).length) return;

      const next = stocks.map((s) => {
        const p = patchMap[s.ticker.trim()];
        return p ? { ...s, cur: p.price, marketState: p.state } : s;
      });
      updateRef.current({ stocks: next });

      if (usTickers.length && !usDone && hourMin >= 4 * 60 + 30) {
        try {
          localStorage.setItem(US_DEDUP_KEY, today);
        } catch {
          // ignore
        }
      }
      if (krTickers.length && !krDone && hourMin >= 15 * 60 + 30) {
        try {
          localStorage.setItem(KR_DEDUP_KEY, today);
        } catch {
          // ignore
        }
      }
    }

    run();
    const timer = setInterval(run, 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [userData]);
}
