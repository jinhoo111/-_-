export type Market = "kr" | "us";

// Identical shape for guest (localStorage) and member (Supabase) holdings — spec §4.5
// requires this so signup can migrate local data with zero loss and zero mapping code.
export interface Holding {
  id: string;
  ticker: string;
  name: string;
  market: Market;
  buyPrice: number | null; // null = no buy price entered → Loss Severity stays gated
  quantity: number;
  createdAt: string;
}

export type Quadrant = "Q1" | "Q2" | "Q3" | "Q4";

// Two independent axes, never a single blended score (spec §6) — a large loss with a
// stable trend and a small loss with a broken trend are different situations.
export interface StopLossResult {
  lossSeverity: number | null; // 0-100, requires buyPrice; null when ungated data is missing
  downtrendSignal: number; // 0-100, always available (no buy price needed)
  quadrant: Quadrant | null; // null until lossSeverity is available
  sentence: string; // plain-language, never prescriptive (spec §7 non-negotiable #1)
  breakEvenPct: number | null; // % gain needed to recover to buy price
  signalDeltaVsLastWeek: number | null;
  asOfDate: string;
}

export interface HeatIndexResult {
  score: number; // 0-100, built entirely from absolute-value inputs (spec §6)
  volumeMultiple: number;
  returnZ: number;
  newsMultiple: number;
  retailNetBuyPct: number | null; // KR-only bonus signal
  asOfDate: string;
}

export interface IndicatorResponse {
  ticker: string;
  price: number;
  history: number[]; // trailing daily closes (~3M), for the Holding Detail trend chart
  stopLoss: StopLossResult;
  heat: HeatIndexResult;
}

export interface RankingRow {
  rank: number;
  ticker: string;
  name: string;
  price: number;
  changePct: number | null;
  heatScore: number;
}
