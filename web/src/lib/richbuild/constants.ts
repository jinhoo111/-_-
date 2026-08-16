// Every score band and percentile cutoff for RichBuild lives here — spec §7 non-negotiable
// #2: "All thresholds live in one config file." These are pre-backtest estimates; recalibrate
// here (or move to a DB-backed config table) once real usage/backtest data comes in — never
// inline a threshold elsewhere.

export const RICHBUILD_THRESHOLDS = {
  lossSeverity: { high: 70, mid: 40 },
  downtrendSignal: { broken: 60, weakening: 35 },
  heatIndex: { hot: 70, warm: 40 },
  // 20-day rolling windows are winsorized to blunt July-2026 crash-day outliers still
  // inside the window at the Sept-2026 launch (spec §1.5), instead of widening the window.
  rollingWindowDays: 20,
  winsorizePercentile: 0.05,
  maWindowDays: 60,
} as const;

// Gate surfaces only at the 6th holding-add attempt (spec §5) — an untested hypothesis,
// kept here rather than hardcoded at the call site so it can change without a code diff.
export const SIGNUP_GATE_HOLDING_COUNT = 6;

// Top 10 (guest) / Top 50 (member), independent of the holdings-limit policy (spec §5).
export const RANKING_DEPTH = { guest: 10, member: 50 } as const;
