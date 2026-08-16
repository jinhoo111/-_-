// Every score band and percentile cutoff for RichBuild lives here — spec §7 non-negotiable
// #2: "All thresholds live in one config file." Values here come from
// richbuild_service_plan_final.md §6 (exact point weights, quadrant boundary) where the
// doc states them explicitly; anywhere it doesn't give an exact normalization curve
// (e.g. how a 3x volume ratio maps onto A1's 20-point budget), the cap/scale constants
// below are this project's placeholder pending backtest — the doc itself defers exact
// calibration to post-launch (§13 "임계값 백테스트... 런칭 후").

export const RICHBUILD_THRESHOLDS = {
  // Quadrant boundary is exactly 50 on BOTH axes (service plan §6.2) — not a
  // separate high/mid split.
  quadrantBoundary: 50,
  // 5-tier grade bands, shared by both axes (service plan §6.2): 0-20 mild / 21-40
  // moderate / 41-60 considerable / 61-80 severe / 81-100 extreme. "Stable"-type
  // words are banned from these labels — they read as a recommendation.
  grade: { mild: 20, moderate: 40, considerable: 60, severe: 80 },
  heatIndex: { hot: 60, warm: 30 }, // service plan §6.1: 0-29 normal / 30-59 rising / 60-100 overheated
  // 20-day rolling windows are winsorized to blunt July-2026 crash-day outliers still
  // inside the window at the Sept-2026 launch (service plan §6.2 "기준선 왜곡 대응"),
  // applied specifically to A1/A2/A4/R2 per that section.
  rollingWindowDays: 20,
  winsorizePercentile: 0.05,
  maWindowDays: 60,

  // Attention Heat Index (뇌동 지표) axis point budgets — service plan §6.1 table.
  // US: A1-A5 × 20pts = 100. KR: A1-A5 × 12pts + K1(20) + K2(20) = 100.
  heatAxisPoints: { us: 20, kr: 12 },
  heatBonusPoints: { retailNetBuy: 20, krxAlert: 20 },
  // Normalization caps for each Ax raw ratio → its point budget (placeholder scale,
  // see file header): ratio reaches this value → axis scores its full point budget.
  heatCaps: {
    volumeRatio: 5, // A1: today's volume ÷ 20d avg
    returnZ: 4, // A2: |today's return| ÷ 20d stdev
    newsRatio: 5, // A3: 48h news count ÷ 30d daily avg
    atrExpansion: 2.5, // A4: ATR(5) ÷ ATR(20)
    directionStreakDays: 5, // A5: consecutive 3%+ same-direction days
    retailNetBuyRatio: 0.3, // K1 (KR only): |retail net-buy ÷ volume| proxy
  },

  // Stop-Loss Indicator — service plan §6.2. R1/R4 (severity) and R2/R3/α
  // (downtrend signal) are exact formulas; the doc doesn't state relative weights
  // between them the way it does for the heat index, so these are this project's
  // placeholder combination weights pending backtest.
  severityWeights: { recovery: 0.7, daysBelowMA60: 0.3 },
  downtrendWeights: { drawdownAtr: 0.45, trendBreak: 0.35, acceleration: 0.2 },
  drawdownAtrCap: 6.7, // R2 (60d-high − price) ÷ ATR(20) reaching this → full weight
  accelerationCap: 2.5, // α recent-5d-drawdown ÷ prior-20d-avg-5d-drawdown reaching this → full weight
} as const;

// Gate surfaces only at the 6th holding-add attempt (spec §5) — an untested hypothesis,
// kept here rather than hardcoded at the call site so it can change without a code diff.
export const SIGNUP_GATE_HOLDING_COUNT = 6;

// Top 10 (guest) / Top 50 (member), independent of the holdings-limit policy (spec §5).
export const RANKING_DEPTH = { guest: 10, member: 50 } as const;
