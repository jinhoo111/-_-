"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { addLocalHolding, clearLocalHoldings, readLocalHoldings, removeLocalHolding } from "@/lib/richbuild/localHoldings";
import { SIGNUP_GATE_HOLDING_COUNT } from "@/lib/richbuild/constants";
import type { Holding, Market } from "@/lib/richbuild/types";

type HoldingRow = {
  id: string;
  ticker: string;
  name: string;
  market: Market;
  buy_price: number | null;
  quantity: number;
  created_at: string;
};

function fromRow(r: HoldingRow): Holding {
  return { id: r.id, ticker: r.ticker, name: r.name, market: r.market, buyPrice: r.buy_price, quantity: r.quantity, createdAt: r.created_at };
}

// Guest-first holdings: reads/writes localStorage when signed out, Supabase when signed
// in. On first authenticated load, migrates any local holdings into the account table
// (spec §4.5 — identical schema means this is a plain insert, no mapping) and clears
// local storage so guest data never lingers stale after signup.
export function useHoldings() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadForUser = useCallback(async (uid: string) => {
    const supabase = createClient();
    const local = readLocalHoldings();
    if (local.length) {
      await supabase.from("richbuild_holdings").insert(
        local.map((h) => ({ user_id: uid, ticker: h.ticker, name: h.name, market: h.market, buy_price: h.buyPrice, quantity: h.quantity })),
      );
      clearLocalHoldings();
    }
    const { data } = await supabase
      .from("richbuild_holdings")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });
    setHoldings((data ?? []).map(fromRow));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        if (cancelled) return;
        const uid = data.user?.id ?? null;
        setUserId(uid);
        if (uid) await loadForUser(uid);
        else setHoldings(readLocalHoldings());
      })
      .catch(() => {
        // Session check failed (offline, expired token, etc.) — fall back to guest
        // mode rather than leaving the UI stuck loading forever.
        if (!cancelled) setHoldings(readLocalHoldings());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadForUser]);

  const addHolding = useCallback(
    async (input: { ticker: string; name: string; market: Market; buyPrice: number | null; quantity: number }) => {
      if (userId) {
        const supabase = createClient();
        const { data } = await supabase
          .from("richbuild_holdings")
          .insert({ user_id: userId, ticker: input.ticker, name: input.name, market: input.market, buy_price: input.buyPrice, quantity: input.quantity })
          .select()
          .single();
        if (data) setHoldings((prev) => [...prev, fromRow(data)]);
        return { gated: false };
      }
      // Signup gate surfaces only at the 6th add attempt (spec §5) — never shown upfront.
      if (holdings.length >= SIGNUP_GATE_HOLDING_COUNT - 1) return { gated: true };
      const created = addLocalHolding(input);
      setHoldings((prev) => [...prev, created]);
      return { gated: false };
    },
    [userId, holdings.length],
  );

  const removeHolding = useCallback(
    async (id: string) => {
      if (userId) {
        const supabase = createClient();
        await supabase.from("richbuild_holdings").delete().eq("id", id);
      } else {
        removeLocalHolding(id);
      }
      setHoldings((prev) => prev.filter((h) => h.id !== id));
    },
    [userId],
  );

  return { holdings, addHolding, removeHolding, isGuest: userId == null, loading };
}
