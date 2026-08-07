// Technical-analysis helpers ported verbatim from legacy index.html's tech scanner
// (`scanTechSignals` / `computeTechnicals` / `classifySignal`). Pure functions — no I/O.
// Label/basis text is exposed as i18n message KEYS per the project convention; only the
// UI layer (which has `useT()` in scope) resolves keys to text.

export type TechSignalKey = "golden_day" | "golden_soon" | "high52" | "disparity";

export interface TechSignal {
  key: TechSignalKey;
  detailKey: string;
  detailParams?: Record<string, string>;
}

export interface TechGrade {
  grade: string;
  rsi: number | null;
  mfi: number | null;
  isLeveraged: boolean;
}

// Signal metadata (label · tone · calculation basis). tone: up=bullish/rebound,
// down=overheated/caution, warn=imminent.
export const TECH_SIG: Record<
  TechSignalKey,
  { labelKey: string; basisKey: string; tone: "up" | "down" | "warn" }
> = {
  golden_day: { labelKey: "home.tech.sig.goldenDay", basisKey: "home.tech.sig.goldenDayBasis", tone: "up" },
  golden_soon: { labelKey: "home.tech.sig.goldenSoon", basisKey: "home.tech.sig.goldenSoonBasis", tone: "warn" },
  high52: { labelKey: "home.tech.sig.high52", basisKey: "home.tech.sig.high52Basis", tone: "up" },
  disparity: { labelKey: "home.tech.sig.disparity", basisKey: "home.tech.sig.disparityBasis", tone: "down" },
};

// RSI+MFI grade badge metadata (ported from legacy GRADE_META).
export const GRADE_META: Record<string, { emoji: string; textKey: string; tone: "up" | "down" }> = {
  STRONG_OVERSOLD: { emoji: "🔴", textKey: "home.tech.grade.strongOversold", tone: "up" },
  RSI_OVERSOLD: { emoji: "🟡", textKey: "home.tech.grade.rsiOversold", tone: "up" },
  MFI_OVERSOLD: { emoji: "🟠", textKey: "home.tech.grade.mfiOversold", tone: "up" },
  STRONG_OVERBOUGHT: { emoji: "🔴", textKey: "home.tech.grade.strongOverbought", tone: "down" },
  RSI_OVERBOUGHT: { emoji: "🟡", textKey: "home.tech.grade.rsiOverbought", tone: "down" },
  MFI_OVERBOUGHT: { emoji: "🟠", textKey: "home.tech.grade.mfiOverbought", tone: "down" },
};

// Signal priority for sorting (strong signals first).
export const SIGNAL_ORDER: Record<TechSignalKey, number> = { golden_day: 0, high52: 1, disparity: 2, golden_soon: 3 };

// Grade thresholds (normal / leveraged ETF) — ported from legacy _SIG_TH.
export const SIGNAL_THRESHOLDS = {
  normal: { rsiOS: 30, mfiOS: 20, rsiOB: 70, mfiOB: 80 },
  lev: { rsiOS: 20, mfiOS: 15, rsiOB: 80, mfiOB: 85 },
};

// Leveraged-ETF detection by name/ticker (no manual tagging), as in legacy.
export function isLeveragedETF(ticker: string, name: string): boolean {
  const s = `${name ?? ""} ${ticker ?? ""}`.toLowerCase();
  return /2x|3x|레버리지|leveraged|daily long|daily short/.test(s);
}

// Simple moving average ending `off` points back from the array end.
export function maAt(closes: number[], n: number, off: number): number | null {
  const end = closes.length - off;
  if (end < n) return null;
  let s = 0;
  for (let i = end - n; i < end; i++) s += closes[i];
  return s / n;
}

// RSI (Wilder smoothing), ported verbatim.
export function rsi14(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let g = 0;
  let l = 0;
  for (let i = 1; i <= period; i++) {
    const c = closes[i] - closes[i - 1];
    if (c >= 0) g += c;
    else l -= c;
  }
  let ag = g / period;
  let al = l / period;
  for (let i = period + 1; i < closes.length; i++) {
    const c = closes[i] - closes[i - 1];
    ag = (ag * (period - 1) + (c > 0 ? c : 0)) / period;
    al = (al * (period - 1) + (c < 0 ? -c : 0)) / period;
  }
  if (al === 0) return 100;
  return 100 - 100 / (1 + ag / al);
}

// MFI (Money Flow Index) from candles [{h,l,c,v}], ported verbatim.
export function calculateMFI(candles: { h: number; l: number; c: number; v: number }[], period = 14): number | null {
  if (!Array.isArray(candles) || candles.length < period + 1) return null;
  const tp = candles.map((c) => (c.h + c.l + c.c) / 3);
  const rmf = candles.map((c, i) => tp[i] * (c.v || 0));
  const n = candles.length;
  let pos = 0;
  let neg = 0;
  for (let i = n - period; i < n; i++) {
    if (i <= 0) continue;
    if (tp[i] > tp[i - 1]) pos += rmf[i];
    else if (tp[i] < tp[i - 1]) neg += rmf[i];
    // tp[i] === tp[i-1] → excluded
  }
  if (neg === 0) return pos > 0 ? 100 : 0;
  const mfi = 100 - 100 / (1 + pos / neg);
  return Math.round(mfi * 100) / 100;
}

// RSI+MFI grade classification (normal vs leveraged thresholds).
export function classifySignal(rsi: number | null, mfi: number | null, isLeveraged: boolean): TechGrade {
  const th = isLeveraged ? SIGNAL_THRESHOLDS.lev : SIGNAL_THRESHOLDS.normal;
  let grade = "NONE";
  if (rsi != null && mfi != null) {
    if (rsi <= th.rsiOS && mfi <= th.mfiOS) grade = "STRONG_OVERSOLD";
    else if (rsi <= th.rsiOS && mfi > th.mfiOS) grade = "RSI_OVERSOLD";
    else if (rsi > th.rsiOS && mfi <= th.mfiOS) grade = "MFI_OVERSOLD";
    else if (rsi >= th.rsiOB && mfi >= th.mfiOB) grade = "STRONG_OVERBOUGHT";
    else if (rsi >= th.rsiOB && mfi < th.mfiOB) grade = "RSI_OVERBOUGHT";
    else if (rsi < th.rsiOB && mfi >= th.mfiOB) grade = "MFI_OVERBOUGHT";
  }
  return { grade, rsi, mfi, isLeveraged };
}

// Closing/high arrays → signal list. detail values are emitted as i18n keys + params.
export function computeTechnicals(closes: number[], highs: number[]): TechSignal[] {
  const out: TechSignal[] = [];
  if (closes.length < 20) return out;
  const price = closes[closes.length - 1];
  const ma5 = maAt(closes, 5, 0);
  const ma20 = maAt(closes, 20, 0);
  const ma5p = maAt(closes, 5, 1);
  const ma20p = maAt(closes, 20, 1);
  if (ma5 && ma20) {
    const gap = ((ma5 - ma20) / ma20) * 100;
    const pgap = ma5p && ma20p ? ((ma5p - ma20p) / ma20p) * 100 : null;
    if (pgap != null && gap > 0 && pgap <= 0) {
      out.push({ key: "golden_day", detailKey: "home.tech.sig.goldenDayDetail" });
    } else if (gap < 0 && gap >= -1.5 && ma5p != null && ma5 > ma5p) {
      // imminent: 5-day MA within 1.5% below the 20-day MA and turning up (excludes flat/dead-cross noise)
      out.push({ key: "golden_soon", detailKey: "home.tech.sig.goldenSoonDetail", detailParams: { gap: gap.toFixed(1) } });
    }
    if (gap >= 10) {
      out.push({ key: "disparity", detailKey: "home.tech.sig.disparityDetail", detailParams: { gap: gap.toFixed(1) } });
    }
  }
  const win = highs.slice(-252);
  const hi52 = win.length ? Math.max(...win) : null;
  if (hi52) {
    const fromHi = ((price - hi52) / hi52) * 100;
    if (fromHi >= -1) out.push({ key: "high52", detailKey: "home.tech.sig.high52Detail", detailParams: { fromHi: fromHi.toFixed(1) } });
  }
  return out;
}
