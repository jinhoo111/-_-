"use client";

import { createContext, useContext, useState } from "react";
import type { Market } from "@/lib/richbuild/types";

const MarketContext = createContext<{ market: Market; setMarket: (m: Market) => void } | null>(null);

// Single global KR/US filter for the whole /richbuild surface — lives in the nav
// (top right), not per-section, so Ranking (and anything else market-scoped added
// later) all read the same selection instead of each carrying its own toggle.
export function RichBuildMarketProvider({ children }: { children: React.ReactNode }) {
  const [market, setMarket] = useState<Market>("kr");
  return <MarketContext.Provider value={{ market, setMarket }}>{children}</MarketContext.Provider>;
}

export function useRichbuildMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useRichbuildMarket must be used within RichBuildMarketProvider");
  return ctx;
}
