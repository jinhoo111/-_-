import { atr14, maAt, stdev, winsorize } from "@/lib/market/technical";
import type { DailyCandles } from "@/lib/market/yahoo";
import { RICHBUILD_THRESHOLDS } from "@/lib/richbuild/constants";
import { classifyQuadrant, quadrantSentence } from "@/lib/richbuild/quadrant";
import type { HeatIndexResult, StopLossResult } from "@/lib/richbuild/types";

// ─────────────────────────────────────────────────────────────────────────────
// APPROXIMATION NOTICE: the PDF (richbuild_features_flow_en.pdf) describes each
// axis's INPUTS precisely but the exact formula/weights live in
// indicator_spec_richbuild.md, which wasn't available when this was written. The
// inputs below match the spec (§6) one-for-one; the combination weights are a
// placeholder for calibration once that doc (or real backtest data) is in hand —
// do not treat the specific weight constants here as final.
// ─────────────────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function dailyReturns(closes: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < closes.length; i++) out.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  return out;
}

// Downtrend Signal (0-100): does NOT require a buy price. Inputs per spec §6:
// drawdown/ATR ratio, moving-average breaks, loss acceleration.
export function computeDowntrendSignal(candles: DailyCandles): number {
  const { closes, highs, lows } = candles;
  const price = closes[closes.length - 1];
  const window = RICHBUILD_THRESHOLDS.rollingWindowDays;

  const recentHigh = Math.max(...closes.slice(-window));
  const atr = atr14(highs, lows, closes) ?? 1;
  const atrMultiple = (recentHigh - price) / atr; // # of ATRs below the recent high

  const ma20 = maAt(closes, 20, 0);
  const ma60 = maAt(closes, RICHBUILD_THRESHOLDS.maWindowDays, 0);
  const maBreakCount = (ma20 != null && price < ma20 ? 1 : 0) + (ma60 != null && price < ma60 ? 1 : 0);

  const returns = winsorize(dailyReturns(closes).slice(-window), RICHBUILD_THRESHOLDS.winsorizePercentile);
  const recent5 = returns.slice(-5).reduce((a, b) => a + b, 0);
  const prior5 = returns.slice(-10, -5).reduce((a, b) => a + b, 0);
  const acceleration = recent5 - prior5; // negative = losses accelerating

  const atrScore = clamp(atrMultiple * 15, 0, 100); // ~6.7 ATR below high → 100
  const maScore = (maBreakCount / 2) * 100;
  const accelScore = clamp(-acceleration * 1000, 0, 100);

  return Math.round(clamp(atrScore * 0.5 + maScore * 0.3 + accelScore * 0.2, 0, 100));
}

// Loss Severity (0-100): requires a buy price — gated behind registration (spec §5).
// Opportunity-cost-vs-index (spec §6) is deferred: it needs a buy DATE to align an
// index series to, and the confirmed Add Holding screen (spec §3) only collects
// ticker/buy price/quantity — no date field. Flagged for product to resolve before
// this axis can be completed; recovery-required-return + days-below-60-day-MA carry
// the score alone for now.
export function computeLossSeverity(candles: DailyCandles, buyPrice: number): number {
  const { closes } = candles;
  const price = closes[closes.length - 1];
  const ma60 = maAt(closes, RICHBUILD_THRESHOLDS.maWindowDays, 0);

  const recoveryNeededPct = Math.max(0, ((buyPrice - price) / price) * 100);
  const recoveryScore = clamp(recoveryNeededPct * 2.5, 0, 100); // 40%+ needed to break even → 100

  let daysBelowMA60 = 0;
  if (ma60 != null) {
    for (let i = closes.length - 1; i >= 0 && closes[i] < ma60; i--) daysBelowMA60++;
  }
  const maScore = clamp((daysBelowMA60 / 60) * 100, 0, 100);

  return Math.round(clamp(recoveryScore * 0.7 + maScore * 0.3, 0, 100));
}

// `unlocked` = the viewer is logged in. Spec §7 non-negotiable #4: "Guests can do
// everything except see Loss Severity" — gated behind REGISTRATION, not merely behind
// having entered a buy price. A guest who supplies a buy price still doesn't see the
// severity score (or its close derivative, break-even %) until they sign up.
export function buildStopLossResult(
  candles: DailyCandles,
  buyPrice: number | null,
  unlocked: boolean,
  asOfDate: string,
): StopLossResult {
  const downtrendSignal = computeDowntrendSignal(candles);
  const price = candles.closes[candles.closes.length - 1];
  const severityAvailable = buyPrice != null && unlocked;
  const lossSeverity = severityAvailable ? computeLossSeverity(candles, buyPrice) : null;
  const breakEvenPct = severityAvailable ? Math.max(0, ((buyPrice - price) / price) * 100) : null;
  const quadrant = lossSeverity != null ? classifyQuadrant(lossSeverity, downtrendSignal) : null;

  let sentence: string;
  if (quadrant) sentence = quadrantSentence(quadrant);
  else if (buyPrice != null && !unlocked) sentence = "Sign up to see your Loss Severity";
  else sentence = "Add your buy price to see the full Stop-Loss read";

  return {
    lossSeverity,
    downtrendSignal,
    quadrant,
    sentence,
    breakEvenPct,
    buyPriceProvided: buyPrice != null,
    signalDeltaVsLastWeek: null, // requires a stored week-ago snapshot — not wired up yet
    asOfDate,
  };
}

// Attention Heat Index (0-100): every axis uses absolute value — panic-buying and
// panic-selling are the same underlying behavior (spec §6). News-volume and the
// KR-only bonus signals (retail net-buy ratio, KRX market-alert status) are not wired
// into the API route yet (see route.ts); this function accepts them as optional
// inputs so the route can add them without an engine change once those feeds are hooked up.
export function buildHeatIndexResult(
  candles: DailyCandles,
  asOfDate: string,
  opts: { newsMultiple?: number; retailNetBuyPct?: number | null } = {},
): HeatIndexResult {
  const { closes, volumes } = candles;
  const window = RICHBUILD_THRESHOLDS.rollingWindowDays;

  const avgVolume = volumes.slice(-window - 1, -1).reduce((a, b) => a + b, 0) / window || 1;
  const volumeMultiple = volumes[volumes.length - 1] / avgVolume;

  const returns = winsorize(dailyReturns(closes).slice(-window), RICHBUILD_THRESHOLDS.winsorizePercentile);
  const sd = stdev(returns) || 0.0001;
  const latestReturn = closes.length > 1 ? (closes[closes.length - 1] - closes[closes.length - 2]) / closes[closes.length - 2] : 0;
  const returnZ = Math.abs(latestReturn / sd);

  const newsMultiple = opts.newsMultiple ?? 1;

  const volumeScore = clamp((volumeMultiple - 1) * 40, 0, 100);
  const returnScore = clamp(returnZ * 25, 0, 100);
  const newsScore = clamp((newsMultiple - 1) * 40, 0, 100);

  const score = Math.round(clamp(volumeScore * 0.45 + returnScore * 0.35 + newsScore * 0.2, 0, 100));

  return {
    score,
    volumeMultiple: Math.round(volumeMultiple * 10) / 10,
    returnZ: Math.round(returnZ * 10) / 10,
    newsMultiple: Math.round(newsMultiple * 10) / 10,
    retailNetBuyPct: opts.retailNetBuyPct ?? null,
    asOfDate,
  };
}
