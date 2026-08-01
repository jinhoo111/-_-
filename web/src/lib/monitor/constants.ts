import type { MonitorCompany, MonitorSignal, SignalWeight } from "@/lib/types/userData";

export const MAX_COMPANIES = 20;
export const OWN_WINDOW_DAYS = 180;

// ── Response/row types (locale-free — labels resolved client-side via t()) ──

export interface Disclosure {
  rcept_no: string;
  rcept_dt: string;
  report_nm: string;
  corp_code?: string;
  corp_name?: string;
  pblntf_ty?: string;
}

export interface OwnershipRow {
  rcept_no: string;
  rcept_dt: string;
  repror?: string;
  stkrt?: string;
  stkrt_irds?: string;
  report_tp?: string;
  report_resn?: string;
  sp_stock_lmp_irds_cnt?: string;
}

export interface HoldingRow {
  inv_prm: string;
  trmend_blce_qy?: string;
  trmend_blce_acntbk_amount?: string;
}

export interface HoldingChange {
  name: string;
  type: "new" | "increase" | "decrease" | "exit";
  detail: string;
}

export interface SecFiling {
  title: string;
  form: string;
  filedAt: string;
  url: string;
}

export interface MonitorCompanyKrData {
  disclosures: Disclosure[];
  major: OwnershipRow[];
  ele: OwnershipRow[];
  holdings: HoldingRow[];
  holdingsYear: number;
}

export interface MonitorCompanyUsData {
  filings: SecFiling[];
  insider: unknown[];
}

// ── DART sign/date helpers ──

export function dartFloat(s: unknown): number {
  const v = parseFloat(String(s == null ? "" : s).replace(/[^0-9.-]/g, ""));
  return isNaN(v) ? 0 : v;
}

export function signOf(s: unknown): 1 | -1 {
  const t = String(s == null ? "" : s);
  return /[△▽(]/.test(t) || /^\s*-/.test(t) ? -1 : 1;
}

export function ownYmd(s: unknown): string {
  return String(s == null ? "" : s).replace(/[^0-9]/g, "");
}

export function withinOwnWindow(dt: string): boolean {
  const s = ownYmd(dt);
  if (s.length !== 8) return false;
  const t = new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)).getTime();
  return Date.now() - t <= OWN_WINDOW_DAYS * 864e5;
}

export function ownSortDesc<T extends { rcept_dt: string }>(list: T[]): T[] {
  return list.sort((a, b) => ownYmd(b.rcept_dt).localeCompare(ownYmd(a.rcept_dt)));
}

// 5%-rule row classification: new (fresh 5% entry) / exit (drop below 5%) / inc / dec
export function classifyMajor(r: OwnershipRow): "new" | "exit" | "inc" | "dec" | "flat" {
  const irds = signOf(r.stkrt_irds) * Math.abs(dartFloat(r.stkrt_irds));
  const rate = Math.abs(dartFloat(r.stkrt));
  const tp = String(r.report_tp || "") + String(r.report_resn || "");
  if (rate > 0 && rate < 5 && rate - irds >= 5) return "exit";
  if (/신규/.test(tp) || (rate >= 5 && rate - irds < 5)) return "new";
  if (irds > 0) return "inc";
  if (irds < 0) return "dec";
  return "flat";
}

// Officer/executive row classification: inc (buy) / dec (sell)
export function classifyEle(r: OwnershipRow): "inc" | "dec" | "flat" {
  const d = signOf(r.sp_stock_lmp_irds_cnt) * Math.abs(dartFloat(r.sp_stock_lmp_irds_cnt));
  return d > 0 ? "inc" : d < 0 ? "dec" : "flat";
}

export function ownCounts(major: OwnershipRow[], ele: OwnershipRow[]): { cNew: number; cInc: number; cDec: number } {
  let cNew = 0,
    cInc = 0,
    cDec = 0;
  (major || []).forEach((r) => {
    const k = classifyMajor(r);
    if (k === "new") cNew++;
    else if (k === "inc") cInc++;
    else if (k === "dec" || k === "exit") cDec++;
  });
  (ele || []).forEach((r) => {
    const k = classifyEle(r);
    if (k === "inc") cInc++;
    else if (k === "dec") cDec++;
  });
  return { cNew, cInc, cDec };
}

export function computeHoldingChanges(curr: HoldingRow[], prev: HoldingRow[]): HoldingChange[] {
  const out: HoldingChange[] = [];
  const prevMap: Record<string, HoldingRow> = {};
  prev.forEach((p) => (prevMap[p.inv_prm] = p));
  const currMap: Record<string, HoldingRow> = {};
  curr.forEach((c) => {
    currMap[c.inv_prm] = c;
    const p = prevMap[c.inv_prm];
    if (!p) {
      out.push({ name: c.inv_prm, type: "new", detail: "new" });
      return;
    }
    const cq = dartFloat(c.trmend_blce_qy);
    const pq = dartFloat(p.trmend_blce_qy);
    if (cq > pq) out.push({ name: c.inv_prm, type: "increase", detail: String(cq - pq) });
    else if (cq < pq) out.push({ name: c.inv_prm, type: "decrease", detail: String(pq - cq) });
  });
  prev.forEach((p) => {
    if (!currMap[p.inv_prm]) out.push({ name: p.inv_prm, type: "exit", detail: "" });
  });
  return out;
}

// ── Disclosure A/B/C/D bucket classification ──

export type DiscType = "A" | "B" | "C" | "D";

export function discType(d: Disclosure): DiscType {
  const t = d.pblntf_ty || "";
  if (t === "A" || /사업보고|분기보고|반기보고/.test(d.report_nm || "")) return "A";
  if (t === "B" || /주요사항/.test(d.report_nm || "")) return "B";
  if (t === "C" || /대량보유|지분/.test(d.report_nm || "")) return "C";
  return "D";
}

export const DISC_TYPE_LABEL_KEY: Record<DiscType, string> = {
  A: "monitor.discType.A",
  B: "monitor.discType.B",
  C: "monitor.discType.C",
  D: "monitor.discType.D",
};

// ── Signal classification taxonomy ──

export type SignalCategory =
  | "capex"
  | "newbiz"
  | "manda"
  | "order"
  | "funding"
  | "governance"
  | "earnings"
  | "ownership";

export const SIGNAL_CATS: Record<SignalCategory, { labelKey: string; weight: SignalWeight; color: string }> = {
  capex: { labelKey: "monitor.signalCat.capex", weight: "high", color: "var(--color-error-text)" },
  newbiz: { labelKey: "monitor.signalCat.newbiz", weight: "high", color: "var(--color-error-text)" },
  manda: { labelKey: "monitor.signalCat.manda", weight: "high", color: "var(--color-error-text)" },
  order: { labelKey: "monitor.signalCat.order", weight: "mid", color: "var(--color-info)" },
  funding: { labelKey: "monitor.signalCat.funding", weight: "mid", color: "var(--color-info)" },
  governance: { labelKey: "monitor.signalCat.governance", weight: "mid", color: "var(--color-info)" },
  earnings: { labelKey: "monitor.signalCat.earnings", weight: "mid", color: "var(--color-info)" },
  ownership: { labelKey: "monitor.signalCat.ownership", weight: "high", color: "var(--color-accent)" },
};

// Order matters — overlapping keywords resolve to the earlier rule.
// "자기주식" (treasury stock) does NOT match `manda` (requires 양수/양도) — falls through to `governance`.
const SIGNAL_RULES: [SignalCategory, RegExp][] = [
  ["capex", /유형자산.*취득|신규.*시설투자|투자판단|생산능력|증설/],
  ["manda", /타법인.*출자|영업양수도|합병|주식.*(양수|양도)|분할/],
  ["newbiz", /정관.*변경|사업목적/],
  ["funding", /유상증자|전환사채|신주인수권부사채|교환사채|자금조달/],
  ["governance", /최대주주.*변경|대량보유|자기주식|경영권/],
  ["order", /단일판매|공급계약|수주/],
  ["earnings", /잠정.*실적|영업.*잠정|사업보고서|분기보고서|반기보고서/],
];

export function signalCategory(d: Disclosure): { category: SignalCategory; weight: SignalWeight } | null {
  const nm = d.report_nm || "";
  for (const [cat, re] of SIGNAL_RULES) {
    if (re.test(nm)) return { category: cat, weight: SIGNAL_CATS[cat].weight };
  }
  return null;
}

export function daysAgoYmd(days: number): string {
  return new Date(Date.now() - days * 864e5).toISOString().slice(0, 10).replace(/-/g, "");
}

// Classifies disclosures into co.signals (dedup by rcept_no, cap 50 newest-first). Returns newly added signals.
export function ingestSignals(co: MonitorCompany, disclosures: Disclosure[]): MonitorSignal[] {
  if (!co || !Array.isArray(disclosures)) return [];
  co.signals = co.signals || [];
  const seen = new Set(co.signals.map((s) => s.rcept_no));
  const added: MonitorSignal[] = [];
  for (const d of disclosures) {
    const no = d.rcept_no || "";
    if (!no || seen.has(no)) continue;
    const sig = signalCategory(d);
    if (!sig) continue;
    seen.add(no);
    const rec: MonitorSignal = { rcept_no: no, date: d.rcept_dt || "", report_nm: d.report_nm || "", category: sig.category, weight: sig.weight };
    co.signals.push(rec);
    added.push(rec);
  }
  if (added.length) {
    co.signals.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (co.signals.length > 50) co.signals = co.signals.slice(0, 50);
  }
  return added;
}

// Promotes only 5%-rule new-entrant/exit ownership events to radar signals — officer trades are noise, card-only.
export function ingestOwnershipSignals(co: MonitorCompany, major: OwnershipRow[]): MonitorSignal[] {
  if (!co) return [];
  co.signals = co.signals || [];
  const seen = new Set(co.signals.map((s) => s.rcept_no));
  const added: MonitorSignal[] = [];
  const add = (r: OwnershipRow, reportNm: string, weight: SignalWeight) => {
    const no = r.rcept_no || "";
    if (!no || seen.has(no)) return;
    seen.add(no);
    const rec: MonitorSignal = { rcept_no: no, date: r.rcept_dt || "", report_nm: reportNm, category: "ownership", weight };
    co.signals!.push(rec);
    added.push(rec);
  };
  (major || []).forEach((r) => {
    const k = classifyMajor(r);
    if (k === "new") add(r, `new:${Math.abs(dartFloat(r.stkrt)).toFixed(2)}:${r.repror || ""}`, "high");
    else if (k === "exit") add(r, `exit:${r.repror || ""}`, "high");
  });
  if (added.length) {
    co.signals.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (co.signals.length > 50) co.signals = co.signals.slice(0, 50);
  }
  return added;
}

export interface AlertEval {
  severity: "critical" | "warn" | "info";
  cats: SignalCategory[];
  hasHigh: boolean;
  clustered: boolean;
}

// Company-level alert severity: critical (any high-weight signal in 30d) > warn (>=2 distinct categories) > info
export function evalAlert(co: MonitorCompany): AlertEval {
  const since = daysAgoYmd(30);
  const recent = (co.signals || []).filter((s) => (s.date || "") >= since);
  const cats = new Set(recent.map((s) => s.category as SignalCategory));
  const hasHigh = recent.some((s) => s.weight === "high");
  let severity: AlertEval["severity"] = "info";
  if (hasHigh) severity = "critical";
  else if (cats.size >= 2) severity = "warn";
  return { severity, cats: [...cats], hasHigh, clustered: cats.size >= 2 };
}

// ── SEC translation tables (as message-key maps, per the i18n indirection convention) ──

export const SEC_ITEM_KEY: Record<string, string> = {
  "1.01": "monitor.secItem.1_01",
  "1.02": "monitor.secItem.1_02",
  "2.01": "monitor.secItem.2_01",
  "2.02": "monitor.secItem.2_02",
  "2.03": "monitor.secItem.2_03",
  "2.05": "monitor.secItem.2_05",
  "3.01": "monitor.secItem.3_01",
  "3.02": "monitor.secItem.3_02",
  "5.02": "monitor.secItem.5_02",
  "5.03": "monitor.secItem.5_03",
  "5.07": "monitor.secItem.5_07",
  "7.01": "monitor.secItem.7_01",
  "8.01": "monitor.secItem.8_01",
  "9.01": "monitor.secItem.9_01",
};

export const SEC_FORM_KEY: Record<string, string> = {
  "8-K": "monitor.secForm.8-K",
  "10-Q": "monitor.secForm.10-Q",
  "10-K": "monitor.secForm.10-K",
  "DEF 14A": "monitor.secForm.DEF14A",
  "SC 13D": "monitor.secForm.SC13D",
  "SC 13G": "monitor.secForm.SC13G",
  "S-1": "monitor.secForm.S-1",
  "6-K": "monitor.secForm.6-K",
  "20-F": "monitor.secForm.20-F",
};

// Returns {kind:"items", codes} for 8-K item-code titles ("2.02,9.01"), or {kind:"raw", text} otherwise.
// 9.01 (exhibits-only) is dropped when other items are present — it carries no information alone.
export function secFilingTitleParts(d: { title?: string; form?: string }): { kind: "items"; codes: string[] } | { kind: "form" } | { kind: "raw"; text: string } {
  const t = String(d.title || "").trim();
  if (/^[\d.,\s]+$/.test(t) && t) {
    const codes = t
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && s !== "9.01");
    if (codes.length) return { kind: "items", codes };
    return { kind: "form" };
  }
  if (t) return { kind: "raw", text: t };
  return { kind: "form" };
}

// ── Misc ──

export function corpCodeIsUs(corpCode: string): boolean {
  return corpCode.startsWith("US:");
}

export function usSyntheticCorpCode(ticker: string): string {
  return `US:${ticker}`;
}
