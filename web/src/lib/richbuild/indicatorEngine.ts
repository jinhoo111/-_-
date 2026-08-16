import { atr14, maAt, stdev, winsorize } from "@/lib/market/technical";
import type { DailyCandles } from "@/lib/market/yahoo";
import { t, type Lang } from "@/lib/i18n/messages";
import { RICHBUILD_THRESHOLDS } from "@/lib/richbuild/constants";
import { classifyQuadrant, quadrantSentence } from "@/lib/richbuild/quadrant";
import type { HeatIndexResult, Market, StopLossResult } from "@/lib/richbuild/types";

// ─────────────────────────────────────────────────────────────────────────────
// Formulas below are transcribed from richbuild_service_plan_final.md §6 (the exact
// spec doc referenced but not initially available — see git history for the earlier
// approximated version). Where §6 gives an exact formula (R1-R5, α, A1-A5, K1-K2) it's
// implemented as written. Where it states a POINT BUDGET but not a normalization curve
// (e.g. "A1 worth 20pts" but not what raw ratio maps to what fraction of 20), or where
// it lists inputs without relative weights (R2/R3/α combining into Downtrend Signal),
// this file picks a reasonable placeholder — kept in constants.ts per §7 non-negotiable
// #2, since §13 itself defers exact calibration to post-launch backtesting.
// ─────────────────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

// Maps a raw ratio onto [0,1] given where it starts being "notable" (baseline) and
// where it saturates the axis's full point budget (cap).
function fraction(raw: number, baseline: number, cap: number): number {
  if (cap === baseline) return raw > baseline ? 1 : 0;
  return clamp((raw - baseline) / (cap - baseline), 0, 1);
}

function dailyReturns(closes: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < closes.length; i++) out.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  return out;
}

// α inputs: the % drawdown over a trailing 5-day window ending at `endIdx`.
function drawdown5dAt(closes: number[], endIdx: number): number {
  if (endIdx - 5 < 0) return 0;
  const start = closes[endIdx - 5];
  const end = closes[endIdx];
  return Math.max(0, (start - end) / start);
}

// R3's "역배열" (reverse/bearish alignment): short MA below medium below long — the
// trend structure is fully inverted, not just one MA broken.
function isReverseAligned(ma20: number | null, ma60: number | null, ma120: number | null): boolean {
  return ma20 != null && ma60 != null && ma120 != null && ma20 < ma60 && ma60 < ma120;
}

// A5: consecutive most-recent days of same-direction 3%+ moves (herding momentum).
function directionStreakDays(closes: number[]): number {
  const returns = dailyReturns(closes);
  if (!returns.length) return 0;
  const signAt = (r: number) => (r >= 0.03 ? 1 : r <= -0.03 ? -1 : 0);
  const lastSign = signAt(returns[returns.length - 1]);
  if (!lastSign) return 0;
  let n = 0;
  for (let i = returns.length - 1; i >= 0 && signAt(returns[i]) === lastSign; i--) n++;
  return n;
}

// Downtrend Signal (0-100): does NOT require a buy price. Service plan §6.2 axis 2:
// R2 drawdown/ATR ratio, R3 MA breaks + reverse alignment, α loss acceleration.
export function computeDowntrendSignal(candles: DailyCandles): number {
  const { closes, highs, lows } = candles;
  const price = closes[closes.length - 1];
  const t = RICHBUILD_THRESHOLDS;

  // R2 = (60-day high − price) ÷ ATR(20)
  const high60 = Math.max(...closes.slice(-t.maWindowDays));
  const atr20 = atr14(highs, lows, closes, 20) ?? 1;
  const r2 = (high60 - price) / atr20;
  const r2Score = fraction(r2, 0, t.drawdownAtrCap) * 100;

  // R3 = 20/60/120-day MA breaks (5pts each) + reverse alignment (5pts), max 20 → scale to 100
  const ma20 = maAt(closes, 20, 0);
  const ma60 = maAt(closes, t.maWindowDays, 0);
  const ma120 = maAt(closes, 120, 0);
  const maBreakPts = (ma20 != null && price < ma20 ? 5 : 0) + (ma60 != null && price < ma60 ? 5 : 0) + (ma120 != null && price < ma120 ? 5 : 0);
  const r3 = maBreakPts + (isReverseAligned(ma20, ma60, ma120) ? 5 : 0); // 0-20
  const r3Score = (r3 / 20) * 100;

  // α = recent 5-day drawdown ÷ prior 20-day average 5-day drawdown
  const lastIdx = closes.length - 1;
  const recentDD = drawdown5dAt(closes, lastIdx);
  const priorDDs: number[] = [];
  for (let i = lastIdx - 1; i >= Math.max(5, lastIdx - 20); i--) priorDDs.push(drawdown5dAt(closes, i));
  const priorAvgDD = priorDDs.length ? priorDDs.reduce((a, b) => a + b, 0) / priorDDs.length : 0;
  const alpha = priorAvgDD > 0 ? recentDD / priorAvgDD : recentDD > 0 ? t.accelerationCap : 0;
  const alphaScore = fraction(alpha, 1, t.accelerationCap) * 100; // ratio of 1 = "normal" pace

  const w = t.downtrendWeights;
  return Math.round(clamp(r2Score * w.drawdownAtr + r3Score * w.trendBreak + alphaScore * w.acceleration, 0, 100));
}

// Loss Severity (0-100): requires a buy price AND login (spec §5/§7 #4). Service plan
// §6.2 axis 1: R1 recovery-required return, R4 days below 60-day MA, R5 opportunity
// cost vs. index. R5 is NOT implemented — it needs a buy DATE to align an index return
// over "the same period" (동기간), and the confirmed Add Holding screen (spec §3, and
// service plan §10.1) only collects ticker/buy price/quantity, no date. This is a
// genuine conflict between the two spec docs, not an implementation gap — flagged for
// product to resolve (either add a buy-date field, or drop R5 from v1).
export function computeLossSeverity(candles: DailyCandles, buyPrice: number): number {
  const { closes } = candles;
  const price = closes[closes.length - 1];
  const ma60 = maAt(closes, RICHBUILD_THRESHOLDS.maWindowDays, 0);

  // R1 = (1 ÷ (1 − lossRate)) − 1, where lossRate = (buyPrice − price) ÷ buyPrice.
  // Algebraically this simplifies to (buyPrice − price) ÷ price — i.e. the same number
  // as "break-even %". Written out per the doc's exact form for traceability.
  const lossRate = Math.max(0, (buyPrice - price) / buyPrice);
  const r1 = 1 / (1 - lossRate) - 1;
  const recoveryScore = clamp(r1 * 250, 0, 100); // 40%+ needed to break even → 100 (placeholder scale)

  let daysBelowMA60 = 0;
  if (ma60 != null) {
    for (let i = closes.length - 1; i >= 0 && closes[i] < ma60; i--) daysBelowMA60++;
  }
  const r4Score = clamp((daysBelowMA60 / 60) * 100, 0, 100);

  const w = RICHBUILD_THRESHOLDS.severityWeights;
  return Math.round(clamp(recoveryScore * w.recovery + r4Score * w.daysBelowMA60, 0, 100));
}

// `unlocked` = the viewer is logged in. Spec §7 non-negotiable #4: "Guests can do
// everything except see Loss Severity" — gated behind REGISTRATION, not merely behind
// having entered a buy price.
export function buildStopLossResult(
  candles: DailyCandles,
  buyPrice: number | null,
  unlocked: boolean,
  asOfDate: string,
  lang: Lang,
): StopLossResult {
  const downtrendSignal = computeDowntrendSignal(candles);
  const price = candles.closes[candles.closes.length - 1];
  const severityAvailable = buyPrice != null && unlocked;
  const lossSeverity = severityAvailable ? computeLossSeverity(candles, buyPrice) : null;
  const breakEvenPct = severityAvailable ? Math.max(0, ((buyPrice - price) / price) * 100) : null;
  const quadrant = lossSeverity != null ? classifyQuadrant(lossSeverity, downtrendSignal) : null;

  let sentence: string;
  if (quadrant) sentence = quadrantSentence(quadrant, lang);
  else if (buyPrice != null && !unlocked) sentence = t(lang, "richbuild.quadrant.gatedSignUp");
  else sentence = t(lang, "richbuild.quadrant.needBuyPrice");

  return {
    lossSeverity,
    downtrendSignal,
    quadrant,
    sentence,
    breakEvenPct,
    buyPriceProvided: buyPrice != null,
    signalDeltaVsLastWeek: null, // needs a stored 7-days-ago IndicatorSnapshot — not wired up yet
    asOfDate,
  };
}

// Attention Heat Index (0-100): every axis uses absolute value (spec §6). Service plan
// §6.1: US = A1-A5 × 20pts each; KR = A1-A5 × 12pts each + K1(20) + K2(20) — KR-only
// bonus signals are a real data advantage the literature's US-only proxies lack.
// A3 (news volume) and K2 (KRX market-alert stage) are NOT wired in: A3 needs a
// news-count feed; K2 needs KRX data, which per this repo's own project history
// (PROJECT_MAP §8.7) is licensed for non-commercial use only and frozen for exactly
// that reason — do not wire K2 to real KRX data without resolving that license first.
export function buildHeatIndexResult(
  candles: DailyCandles,
  market: Market,
  asOfDate: string,
  opts: { newsMultiple?: number; retailNetBuyRatio?: number | null } = {},
): HeatIndexResult {
  const { closes, highs, lows, volumes } = candles;
  const t = RICHBUILD_THRESHOLDS;
  const window = t.rollingWindowDays;

  // A1: today's volume ÷ 20-day average
  const avgVolume = volumes.slice(-window - 1, -1).reduce((a, b) => a + b, 0) / window || 1;
  const volumeMultiple = volumes[volumes.length - 1] / avgVolume;

  // A2: |today's return| ÷ 20-day stdev of daily returns (winsorized per §6.2 "기준선 왜곡 대응")
  const returns = winsorize(dailyReturns(closes).slice(-window), t.winsorizePercentile);
  const sd = stdev(returns) || 0.0001;
  const latestReturn = closes.length > 1 ? (closes[closes.length - 1] - closes[closes.length - 2]) / closes[closes.length - 2] : 0;
  const returnZ = Math.abs(latestReturn / sd);

  // A3: 48h news count ÷ 30-day daily average — not wired in, neutral (ratio 1) default
  const newsMultiple = opts.newsMultiple ?? 1;

  // A4: ATR(5) ÷ ATR(20)
  const atr5 = atr14(highs, lows, closes, 5) ?? 1;
  const atr20 = atr14(highs, lows, closes, 20) ?? 1;
  const atrExpansion = atr5 / atr20;

  // A5: consecutive same-direction 3%+ days
  const streakDays = directionStreakDays(closes);

  const isKr = market === "kr";
  const axisPts = isKr ? t.heatAxisPoints.kr : t.heatAxisPoints.us;
  const a1 = fraction(volumeMultiple, 1, t.heatCaps.volumeRatio) * axisPts;
  const a2 = fraction(returnZ, 0, t.heatCaps.returnZ) * axisPts;
  const a3 = fraction(newsMultiple, 1, t.heatCaps.newsRatio) * axisPts;
  const a4 = fraction(atrExpansion, 1, t.heatCaps.atrExpansion) * axisPts;
  const a5 = fraction(streakDays, 0, t.heatCaps.directionStreakDays) * axisPts;

  let score = a1 + a2 + a3 + a4 + a5;
  let retailNetBuyPct: number | null = null;
  if (isKr) {
    // K1: |retail net-buy ÷ volume| — a proxy for "개인순매수 ÷ 총거래대금" (retail
    // net-buy value ÷ total trading value); we have share-volume, not trading value,
    // from the daily candles alone. See route.ts for where the real ratio (when
    // available from flow/server.ts) overrides this.
    const retailRatio = opts.retailNetBuyRatio ?? null;
    retailNetBuyPct = retailRatio != null ? Math.round(retailRatio * 1000) / 10 : null;
    const k1 = retailRatio != null ? fraction(Math.abs(retailRatio), 0, t.heatCaps.retailNetBuyRatio) * t.heatBonusPoints.retailNetBuy : 0;
    // K2 (KRX market-alert stage) intentionally omitted — see file header.
    const k2 = 0;
    score += k1 + k2;
  }

  return {
    score: Math.round(clamp(score, 0, 100)),
    volumeMultiple: Math.round(volumeMultiple * 10) / 10,
    returnZ: Math.round(returnZ * 10) / 10,
    newsMultiple: Math.round(newsMultiple * 10) / 10,
    retailNetBuyPct,
    asOfDate,
  };
}
