import type { Budget, GlucoseEntry, GlucoseSlot, Health, ImpulseTradeEntry, LedgerEntry, LedgerType, MarketEvent, MemoTag, WeightEntry } from "@/lib/types/userData";

export const TAG_KEYS: MemoTag[] = ["general", "buy", "sell", "monitor", "flow"];

export type TagMeta = { labelKey: string; bg: string; fg: string };

const TAG_META: Record<MemoTag, TagMeta> = {
  general: { labelKey: "journal.tag.general", bg: "--color-info-bg", fg: "--color-info" },
  buy: { labelKey: "journal.tag.buy", bg: "--color-success-bg", fg: "--color-success-text" },
  sell: { labelKey: "journal.tag.sell", bg: "--color-error-bg", fg: "--color-error-text" },
  monitor: { labelKey: "journal.tag.monitor", bg: "--color-warning-bg", fg: "--color-warning-text" },
  flow: { labelKey: "journal.tag.flow", bg: "--color-accent-bg", fg: "--color-accent" },
};

export function tagMeta(tag: string): TagMeta {
  return TAG_META[tag as MemoTag] ?? TAG_META.general;
}

// Local (not UTC) YYYY-MM-DD key — matches how legacy buckets calendar entries,
// avoiding the UTC-rollover bug that shows entries on the wrong day near midnight.
export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Writes/reads at noon-local time to avoid TZ date-rollover when serialized to ISO.
export function noonLocalIso(year: number, month: number, day: number): string {
  return new Date(year, month, day, 12, 0, 0).toISOString();
}

// Empty time ('') = all-day, sorted before any timed entry (matches legacy _schedSort).
export function scheduleSort(a: { time: string; id: string }, b: { time: string; id: string }): number {
  const ta = a.time || "";
  const tb = b.time || "";
  if (ta === tb) return a.id.localeCompare(b.id);
  if (!ta) return -1;
  if (!tb) return 1;
  return ta.localeCompare(tb);
}

// Ported verbatim from legacy LEDGER_CATS. Stored `cat` value stays this Korean literal
// in both languages (parity with existing/legacy rows) — only the rendered label translates.
export const LEDGER_CATS: Record<LedgerType, string[]> = {
  expense: ["식비", "교통", "주거", "쇼핑", "의료", "여가", "기타"],
  income: ["급여", "용돈", "투자수익", "기타"],
};

const LEDGER_CAT_LABEL_KEY: Record<string, string> = {
  식비: "journal.ledger.cat.food",
  교통: "journal.ledger.cat.transport",
  주거: "journal.ledger.cat.housing",
  쇼핑: "journal.ledger.cat.shopping",
  의료: "journal.ledger.cat.medical",
  여가: "journal.ledger.cat.leisure",
  기타: "journal.ledger.cat.other",
  급여: "journal.ledger.cat.salary",
  용돈: "journal.ledger.cat.allowance",
  투자수익: "journal.ledger.cat.investmentGain",
};

export function ledgerCatLabelKey(cat: string): string {
  return LEDGER_CAT_LABEL_KEY[cat] ?? cat;
}

export function fmtWon(n: number): string {
  return "₩" + Math.round(Math.abs(n)).toLocaleString();
}

// Net income/expense for a given year-month, ported from legacy _ledgerMonthTotals.
export function ledgerMonthTotals(entries: LedgerEntry[], year: number, month: number): { inc: number; exp: number; net: number } {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  let inc = 0;
  let exp = 0;
  for (const e of entries) {
    if (!e.date.startsWith(prefix)) continue;
    if (e.type === "income") inc += e.amount;
    else exp += e.amount;
  }
  return { inc, exp, net: inc - exp };
}

// Per-day ledger indicator for month-calendar cells, ported from legacy's
// `dexp>0 ? '💸' : dinc>0 ? '💰' : ''` — expense takes priority over income, not net.
export function dayLedgerIcon(entries: LedgerEntry[]): "expense" | "income" | null {
  let inc = 0;
  let exp = 0;
  for (const e of entries) {
    if (e.type === "income") inc += e.amount;
    else exp += e.amount;
  }
  if (exp > 0) return "expense";
  if (inc > 0) return "income";
  return null;
}

export function ymKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

// Rounds to 1 decimal via *10 round /10 (avoids float drift), ported from legacy stepWeight/saveWeight.
export function roundKg(v: number): number {
  return Math.round(v * 10) / 10;
}

// "Close enough to goal/previous" epsilon, ported from legacy's repeated 0.05 magic number
// (day-panel goal delta + Report tab wgCompare) — drives the green-highlight threshold.
export const WEIGHT_GOAL_EPSILON = 0.05;

export interface HealthStats {
  start: number;
  latest: number;
  diff: number;
  pct: number;
  dod: number | null;
  goal: number | null;
  goalRemain: number | null;
  goalPct: number | null;
}

// Month-level weight stats for the calendar header summary, ported from legacy _healthStats.
export function healthStats(entries: WeightEntry[], year: number, month: number, goal: number | null): HealthStats | null {
  const prefix = ymKey(year, month);
  const es = entries
    .filter((e) => e.date.startsWith(prefix) && e.kg > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (es.length === 0) return null;

  const start = es[0].kg;
  const latest = es[es.length - 1].kg;
  const diff = latest - start;
  const pct = start ? (diff / start) * 100 : 0;
  const dod = es.length >= 2 ? latest - es[es.length - 2].kg : null;

  let goalRemain: number | null = null;
  let goalPct: number | null = null;
  if (goal != null) {
    goalRemain = latest - goal;
    if (start !== goal) goalPct = Math.max(0, Math.min(100, ((start - latest) / (start - goal)) * 100));
  }

  return { start, latest, diff, pct, dod, goal, goalRemain, goalPct };
}

// Day-of-month -> kg map for the month, used to populate calendar day-cell chips (legacy _healthByDay).
export function healthByDay(entries: WeightEntry[], year: number, month: number): Map<string, number> {
  const prefix = ymKey(year, month);
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e.date.startsWith(prefix)) map.set(e.date, e.kg);
  }
  return map;
}

// Ported verbatim from legacy GLU_SLOTS — measurement-timing order + label keys.
export const GLU_SLOTS: GlucoseSlot[] = ["fasting", "beforeMeal", "afterMeal2", "bedtime", "random"];

const GLU_SLOT_LABEL_KEY: Record<GlucoseSlot, string> = {
  fasting: "journal.glucose.slot.fasting",
  beforeMeal: "journal.glucose.slot.beforeMeal",
  afterMeal2: "journal.glucose.slot.afterMeal2",
  bedtime: "journal.glucose.slot.bedtime",
  random: "journal.glucose.slot.random",
};

export function gluSlotLabelKey(slot: GlucoseSlot): string {
  return GLU_SLOT_LABEL_KEY[slot];
}

const GLU_ORDER: Record<GlucoseSlot, number> = { fasting: 0, beforeMeal: 1, afterMeal2: 2, bedtime: 3, random: 4 };

export function glucoseSort(a: GlucoseEntry, b: GlucoseEntry): number {
  return GLU_ORDER[a.slot] - GLU_ORDER[b.slot];
}

export type GlucoseStatusKey = "low" | "normal" | "warn" | "high";

// Reference-range classification (Korean Diabetes Association general guidance).
// Informational only, not a diagnosis — ported verbatim from legacy _glucoseStatus.
export function glucoseStatus(slot: GlucoseSlot, mgdl: number): { labelKey: string; key: GlucoseStatusKey } {
  if (mgdl < 70) return { labelKey: "journal.glucose.status.low", key: "low" };
  const fastingType = slot === "fasting" || slot === "beforeMeal";
  if (fastingType) {
    if (mgdl < 100) return { labelKey: "journal.glucose.status.normal", key: "normal" };
    if (mgdl < 126) return { labelKey: "journal.glucose.status.warn", key: "warn" };
    return { labelKey: "journal.glucose.status.high", key: "high" };
  }
  if (mgdl < 140) return { labelKey: "journal.glucose.status.normal", key: "normal" };
  if (mgdl < 200) return { labelKey: "journal.glucose.status.warn", key: "warn" };
  return { labelKey: "journal.glucose.status.high", key: "high" };
}

const GLU_STATUS_COLOR: Record<GlucoseStatusKey, { bg: string; fg: string }> = {
  low: { bg: "--color-info-bg", fg: "--color-info" },
  normal: { bg: "--color-success-bg", fg: "--color-success-text" },
  warn: { bg: "--color-warning-subtle", fg: "--color-warning-dark" },
  high: { bg: "--color-error-bg", fg: "--color-error-text" },
};

export function gluStatusColor(key: GlucoseStatusKey): { bg: string; fg: string } {
  return GLU_STATUS_COLOR[key];
}

export function gluRangeHintKey(slot: GlucoseSlot): string {
  return slot === "fasting" || slot === "beforeMeal" ? "journal.glucose.rangeHint.fasting" : "journal.glucose.rangeHint.post";
}

// Representative per-day value for calendar chips: prefers a fasting-slot reading
// over any other slot recorded the same day, ported from legacy _glucoseByDay.
export function glucoseByDay(entries: GlucoseEntry[], year: number, month: number): Map<string, GlucoseEntry> {
  const prefix = ymKey(year, month);
  const map = new Map<string, GlucoseEntry>();
  for (const e of entries) {
    if (!e.date.startsWith(prefix) || !(e.mgdl > 0)) continue;
    const cur = map.get(e.date);
    if (!cur) map.set(e.date, e);
    else if (e.slot === "fasting" && cur.slot !== "fasting") map.set(e.date, e);
  }
  return map;
}

export interface GlucoseStats {
  fastAvg: number | null;
  postAvg: number | null;
  max: GlucoseEntry;
  days: number;
}

// Month-level glucose stats for the calendar header summary, ported from legacy _glucoseStats.
export function glucoseStats(entries: GlucoseEntry[], year: number, month: number): GlucoseStats | null {
  const prefix = ymKey(year, month);
  const es = entries.filter((e) => e.date.startsWith(prefix) && e.mgdl > 0);
  if (es.length === 0) return null;

  const avg = (a: number[]) => (a.length ? Math.round(a.reduce((s, v) => s + v, 0) / a.length) : null);
  const fast = es.filter((e) => e.slot === "fasting" || e.slot === "beforeMeal").map((e) => e.mgdl);
  const post = es.filter((e) => e.slot === "afterMeal2" || e.slot === "random" || e.slot === "bedtime").map((e) => e.mgdl);
  const max = es.reduce((m, e) => (e.mgdl > m.mgdl ? e : m), es[0]);
  const days = new Set(es.map((e) => e.date)).size;

  return { fastAvg: avg(fast), postAvg: avg(post), max, days };
}

// Day-of-month -> workout state map for the month, used to populate calendar day-cell
// chips and the day-panel toggle (legacy _workoutByDay).
export function workoutByDay(workouts: Record<string, "done" | "off">, year: number, month: number): Map<string, "done" | "off"> {
  const prefix = ymKey(year, month);
  const map = new Map<string, "done" | "off">();
  for (const [date, v] of Object.entries(workouts)) {
    if (date.startsWith(prefix)) map.set(date, v);
  }
  return map;
}

// Day-of-month -> impulse-trade entry map for the month, used to populate calendar
// day-cell chips and the day-panel indicator (legacy _impulseByDay).
export function impulseByDay(entries: ImpulseTradeEntry[], year: number, month: number): Map<string, ImpulseTradeEntry> {
  const prefix = ymKey(year, month);
  const map = new Map<string, ImpulseTradeEntry>();
  for (const e of entries) {
    if (e.date.startsWith(prefix)) map.set(e.date, e);
  }
  return map;
}

// Date-then-createdAt sort, direction togglable in the Philosophy view (legacy _impulseSorted).
export function impulseSort(entries: ImpulseTradeEntry[], dir: "asc" | "desc"): ImpulseTradeEntry[] {
  return [...entries].sort((a, b) => {
    const c = a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);
    return dir === "desc" ? -c : c;
  });
}

// Locale-aware port of legacy _fmtImpulseDate (fixed 'ko-KR') for the Philosophy view's impulse chip label.
export function fmtImpulseDate(ymd: string, lang: "ko" | "en"): string {
  return new Date(`${ymd}T00:00:00`).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", {
    year: "2-digit",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

export interface ReportWeek {
  idx: number;
  start: Date;
  end: Date;
}

// Monday-start weeks covering the month; week 1 is whichever week contains the 1st
// (so it can start in the previous month), ports legacy _rptWeeks verbatim.
export function rptWeeks(year: number, mo: number): ReportWeek[] {
  const first = new Date(year, mo, 1);
  const offMon = (first.getDay() + 6) % 7;
  const wk1Mon = new Date(year, mo, 1 - offMon);
  const monthEnd = new Date(year, mo, new Date(year, mo + 1, 0).getDate());
  const weeks: ReportWeek[] = [];
  let ws = new Date(wk1Mon);
  let idx = 1;
  while (ws <= monthEnd) {
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    weeks.push({ idx, start: new Date(ws), end: we });
    ws = new Date(ws);
    ws.setDate(ws.getDate() + 7);
    idx++;
  }
  return weeks;
}

export function ymdOf(d: Date): string {
  return dateKey(d);
}

export function weekIdxOf(dateStr: string, weeks: ReportWeek[]): number {
  for (let i = 0; i < weeks.length; i++) {
    if (dateStr >= ymdOf(weeks[i].start) && dateStr <= ymdOf(weeks[i].end)) return i;
  }
  return -1;
}

export interface WeeklyTargets {
  W: number;
  ym: string;
  inc: (number | null)[];
  exp: (number | null)[];
}

// Per-week income/expense targets: user-allocated incomeWeeks/expenseWeeks take
// priority, else the month total is split evenly across weeks. Ports legacy _weeklyTargets.
export function weeklyTargets(budget: Budget, year: number, mo: number): WeeklyTargets {
  const ym = ymKey(year, mo);
  const W = rptWeeks(year, mo).length;
  const b = budget[ym] ?? { income: null, expense: null };
  const eqI = b.income != null ? b.income / W : null;
  const eqE = b.expense != null ? b.expense / W : null;
  const fix = (arr: (number | null)[] | undefined, eq: number | null) => {
    const a = Array.isArray(arr) ? arr.slice(0, W).map((v) => (v != null && isFinite(v) ? v : eq)) : [];
    while (a.length < W) a.push(eq);
    return a;
  };
  return {
    W,
    ym,
    inc: Array.isArray(b.incomeWeeks) && b.incomeWeeks.length ? fix(b.incomeWeeks, eqI) : Array(W).fill(eqI),
    exp: Array.isArray(b.expenseWeeks) && b.expenseWeeks.length ? fix(b.expenseWeeks, eqE) : Array(W).fill(eqE),
  };
}

// Per-week actual income/expense sums from ledger entries in that month, keyed by week index.
export function weeklyActuals(ledger: LedgerEntry[], year: number, mo: number, weeks: ReportWeek[]): { inc: number[]; exp: number[] } {
  const ym = ymKey(year, mo);
  const inc = Array(weeks.length).fill(0);
  const exp = Array(weeks.length).fill(0);
  for (const e of ledger) {
    if (!e.date.startsWith(ym)) continue;
    const i = weekIdxOf(e.date, weeks);
    if (i < 0) continue;
    if (e.type === "income") inc[i] += e.amount || 0;
    else exp[i] += e.amount || 0;
  }
  return { inc, exp };
}

// Per-week actual weight: manual health.weeklyActual override first, else the entry
// logged on the week's Sunday, else the latest entry within the week's range. Ports _weeklyWeights.
export function weeklyWeights(health: Health, year: number, mo: number, weeks: ReportWeek[]): (number | null)[] {
  const ym = ymKey(year, mo);
  const ov = health.weeklyActual[ym] ?? [];
  return weeks.map((w, i) => {
    const overridden = ov[i];
    if (overridden != null && isFinite(overridden)) return overridden;
    const s = ymdOf(w.start);
    const e = ymdOf(w.end);
    const sun = health.entries.find((en) => en.kg > 0 && en.date === e);
    if (sun) return sun.kg;
    const inWk = health.entries.filter((en) => en.kg > 0 && en.date >= s && en.date <= e).sort((a, b) => a.date.localeCompare(b.date));
    return inWk.length ? inWk[inWk.length - 1].kg : null;
  });
}

// Hand-maintained macro calendar, ported verbatim from index.html's MARKET_EVENTS.
// Local-only for this pass — live Finnhub/DART earnings are deferred to Phase 3.
export const MARKET_EVENTS: MarketEvent[] = [
  { id: "fomc-2025-12", date: "2025-12-10", type: "fomc", title: "FOMC" },
  { id: "cpi-2025-12", date: "2025-12-12", type: "cpi", title: "CPI" },
  { id: "opex-2025-12", date: "2025-12-19", type: "opex", title: "OpEx" },
  { id: "fomc-2026-01", date: "2026-01-28", type: "fomc", title: "FOMC" },
  { id: "cpi-2026-01", date: "2026-01-13", type: "cpi", title: "CPI" },
  { id: "opex-2026-01", date: "2026-01-16", type: "opex", title: "OpEx" },
  { id: "fomc-2026-03", date: "2026-03-18", type: "fomc", title: "FOMC" },
  { id: "cpi-2026-02", date: "2026-02-11", type: "cpi", title: "CPI" },
  { id: "opex-2026-02", date: "2026-02-20", type: "opex", title: "OpEx" },
  { id: "opex-2026-03", date: "2026-03-20", type: "opex", title: "OpEx" },
  { id: "fomc-2026-04", date: "2026-04-29", type: "fomc", title: "FOMC" },
  { id: "opex-2026-04", date: "2026-04-17", type: "opex", title: "OpEx" },
  { id: "fomc-2026-06", date: "2026-06-17", type: "fomc", title: "FOMC" },
  { id: "opex-2026-05", date: "2026-05-15", type: "opex", title: "OpEx" },
  { id: "opex-2026-06", date: "2026-06-19", type: "opex", title: "OpEx" },
  { id: "fomc-2026-07", date: "2026-07-29", type: "fomc", title: "FOMC" },
  { id: "opex-2026-07", date: "2026-07-17", type: "opex", title: "OpEx" },
  { id: "jackson-hole-2026", date: "2026-08-21", type: "jacksonHole", title: "Jackson Hole" },
  { id: "opex-2026-08", date: "2026-08-21", type: "opex", title: "OpEx" },
  { id: "fomc-2026-09", date: "2026-09-16", type: "fomc", title: "FOMC" },
  { id: "opex-2026-09", date: "2026-09-18", type: "opex", title: "OpEx" },
];
