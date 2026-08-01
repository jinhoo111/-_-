import "server-only";
import { cacheGet, cacheGetStale, cacheSet } from "@/lib/flow/cache";
import { SEC_UA, getInsiderStock } from "@/lib/flow/server";
import corpMap from "@/lib/monitor/corpMap.json";
import {
  daysAgoYmd,
  dartFloat,
  ownSortDesc,
  withinOwnWindow,
  type Disclosure,
  type HoldingRow,
  type OwnershipRow,
  type SecFiling,
} from "@/lib/monitor/constants";
import type { MonitorMarket } from "@/lib/types/userData";

// DART calls go direct to opendart.fss.or.kr — Vercel functions are server-to-server, so the
// legacy browser-side multi-proxy CORS race (`_dartProxyRace`) is unnecessary here.
const DART_BASE = "https://opendart.fss.or.kr/api";

async function callDart<T = Record<string, unknown>>(endpoint: string, params: Record<string, string>): Promise<T> {
  const key = process.env.OWNER_DART_KEY;
  if (!key) throw new Error("dart_key_missing");
  const qs = new URLSearchParams({ crtfc_key: key, ...params });
  const r = await fetch(`${DART_BASE}/${endpoint}?${qs}`, { signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error(`dart_http_${r.status}`);
  const d = (await r.json()) as T & { status?: string; message?: string };
  if (d && typeof d === "object" && "status" in d && d.status && d.status !== "000" && d.status !== "013") {
    throw new Error(`dart_${d.status}:${d.message ?? ""}`);
  }
  return d;
}

const CORP_MAP = corpMap as unknown as Record<string, [string, string]>;

// ── Resolve: search term -> company ──

export interface ResolvedCompany {
  market: MonitorMarket;
  corp_code: string;
  corp_name: string;
  stock_code: string;
  cik?: string;
  exchange?: string;
}

async function resolveUsTicker(ticker: string): Promise<ResolvedCompany | null> {
  const r = await fetch("https://www.sec.gov/files/company_tickers.json", { headers: SEC_UA, signal: AbortSignal.timeout(10_000) }).catch(() => null);
  if (!r?.ok) return null;
  const raw = (await r.json()) as Record<string, { ticker: string; cik_str: number; title: string }>;
  for (const k of Object.keys(raw)) {
    if (raw[k].ticker === ticker) {
      return {
        market: "US",
        corp_code: `US:${ticker}`,
        corp_name: raw[k].title,
        stock_code: ticker,
        cik: String(raw[k].cik_str).padStart(10, "0"),
      };
    }
  }
  return null;
}

async function naverSearchKr(query: string): Promise<{ code: string; name: string } | null> {
  const r = await fetch(`https://ac.stock.naver.com/ac?q=${encodeURIComponent(query)}&target=stock`, { signal: AbortSignal.timeout(8_000) }).catch(() => null);
  if (!r?.ok) return null;
  const d = (await r.json().catch(() => null)) as { items?: unknown[][] } | null;
  const items = (d?.items?.[0] ?? []) as { code: string; name: string; nationCode?: string }[];
  const kr = items.find((it) => (it.nationCode || "").toUpperCase() === "KOR" || (it.nationCode || "").toUpperCase() === "KRX");
  return kr ? { code: kr.code, name: kr.name } : null;
}

function marketFromCorpCls(cls: string | undefined): MonitorMarket {
  return cls === "Y" ? "KOSPI" : cls === "K" ? "KOSDAQ" : cls === "N" ? "KONEX" : "기타";
}

export async function resolveCompany(q: string): Promise<ResolvedCompany | null> {
  const val = q.trim();
  if (!val) return null;

  if (/^[A-Za-z.-]{1,10}$/.test(val)) {
    const us = await resolveUsTicker(val.toUpperCase()).catch(() => null);
    if (us) return us;
  }

  let stockCode = /^\d{6}$/.test(val) ? val : "";
  let fallbackName = "";
  if (!stockCode) {
    const found = await naverSearchKr(val).catch(() => null);
    if (!found) return null;
    stockCode = found.code;
    fallbackName = found.name;
  }

  const mapped = CORP_MAP[stockCode];
  if (!mapped) return null;
  const [corpCode, mapName] = mapped;

  let company: { corp_name?: string; stock_code?: string; corp_cls?: string } = {};
  try {
    company = await callDart("company.json", { corp_code: corpCode });
  } catch {
    // proceed with mapped info only
  }

  return {
    market: marketFromCorpCls(company.corp_cls),
    corp_code: corpCode,
    corp_name: company.corp_name || fallbackName || mapName,
    stock_code: company.stock_code || stockCode,
  };
}

// ── KR company bundle: disclosures + ownership + holdings ──

export interface MonitorKrBundle {
  disclosures: Disclosure[];
  major: OwnershipRow[];
  ele: OwnershipRow[];
  holdings: HoldingRow[];
  holdingsYear: number;
}

const validHoldings = (list: unknown): HoldingRow[] =>
  (Array.isArray(list) ? (list as HoldingRow[]) : []).filter((h) => h.inv_prm && h.inv_prm !== "-" && h.inv_prm !== "합계" && !/^합\s*계$/.test(h.inv_prm));

async function fetchDisclosures(corpCode: string): Promise<Disclosure[]> {
  const end = daysAgoYmd(0);
  const start = daysAgoYmd(30);
  const d = await callDart<{ list?: Disclosure[] }>("list.json", { corp_code: corpCode, bgn_de: start, end_de: end, page_count: "100" });
  return Array.isArray(d.list) ? d.list : [];
}

async function fetchOwnership(corpCode: string): Promise<{ major: OwnershipRow[]; ele: OwnershipRow[] }> {
  const [maj, ele] = await Promise.allSettled([
    callDart<{ list?: OwnershipRow[] }>("majorstock.json", { corp_code: corpCode }).then((d) => ownSortDesc((Array.isArray(d.list) ? d.list : []).filter((r) => withinOwnWindow(r.rcept_dt)))),
    callDart<{ list?: OwnershipRow[] }>("elestock.json", { corp_code: corpCode }).then((d) => ownSortDesc((Array.isArray(d.list) ? d.list : []).filter((r) => withinOwnWindow(r.rcept_dt)))),
  ]);
  return { major: maj.status === "fulfilled" ? maj.value : [], ele: ele.status === "fulfilled" ? ele.value : [] };
}

async function fetchHoldingsYear(corpCode: string, year: number): Promise<HoldingRow[]> {
  const d = await callDart<{ list?: HoldingRow[] }>("otrCprInvstmntSttus.json", { corp_code: corpCode, bsns_year: String(year), reprt_code: "11011" });
  return validHoldings(d.list);
}

// 타법인 출자현황 is only complete on the annual report (11011) — fall back to the prior year if unavailable yet.
async function fetchHoldings(corpCode: string): Promise<{ list: HoldingRow[]; year: number }> {
  const ty = new Date().getFullYear();
  for (let y = ty - 1; y >= ty - 2; y--) {
    const list = await fetchHoldingsYear(corpCode, y).catch(() => []);
    if (list.length) return { list, year: y };
  }
  return { list: [], year: ty - 1 };
}

export async function getMonitorKrCompany(corpCode: string): Promise<MonitorKrBundle> {
  const key = `monitor:kr:${corpCode}`;
  const cached = (await cacheGet(key, 30 * 60_000)) as MonitorKrBundle | null;
  if (cached) return cached;
  try {
    const [discRes, ownRes, holdRes] = await Promise.allSettled([fetchDisclosures(corpCode), fetchOwnership(corpCode), fetchHoldings(corpCode)]);
    const data: MonitorKrBundle = {
      disclosures: discRes.status === "fulfilled" ? discRes.value : [],
      major: ownRes.status === "fulfilled" ? ownRes.value.major : [],
      ele: ownRes.status === "fulfilled" ? ownRes.value.ele : [],
      holdings: holdRes.status === "fulfilled" ? holdRes.value.list : [],
      holdingsYear: holdRes.status === "fulfilled" ? holdRes.value.year : new Date().getFullYear() - 1,
    };
    await cacheSet(key, data);
    return data;
  } catch (e) {
    const stale = (await cacheGetStale(key)) as MonitorKrBundle | null;
    if (stale) return stale;
    throw e;
  }
}

// ── US company bundle: SEC filings + Form 4 insider ──

const US_FORMS = ["8-K", "10-Q", "10-K", "S-1", "SC 13D", "SC 13G", "DEF 14A", "6-K", "20-F"];

export interface MonitorUsBundle {
  filings: SecFiling[];
  insider: Awaited<ReturnType<typeof getInsiderStock>>["rows"];
}

async function fetchSecFilings(cik: string): Promise<SecFiling[]> {
  const r = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, { headers: SEC_UA, signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error(`sec_${r.status}`);
  const sub = await r.json();
  const rec = sub.filings?.recent ?? {};
  const out: SecFiling[] = [];
  for (let i = 0; i < (rec.form?.length || 0) && out.length < 15; i++) {
    const form = String(rec.form[i]);
    if (!US_FORMS.some((f) => form.startsWith(f))) continue;
    const acc = String(rec.accessionNumber[i]).replace(/-/g, "");
    out.push({
      title: rec.primaryDocDescription?.[i] || form,
      form,
      filedAt: rec.filingDate[i],
      url: `https://www.sec.gov/Archives/edgar/data/${cik.replace(/^0+/, "")}/${acc}/${rec.primaryDocument?.[i] || ""}`,
    });
  }
  return out;
}

export async function getMonitorUsCompany(ticker: string, cik: string): Promise<MonitorUsBundle> {
  const key = `monitor:us:${ticker}`;
  const cached = (await cacheGet(key, 30 * 60_000)) as MonitorUsBundle | null;
  if (cached) return cached;
  try {
    const [filingsRes, insiderRes] = await Promise.allSettled([fetchSecFilings(cik), getInsiderStock(ticker)]);
    const data: MonitorUsBundle = {
      filings: filingsRes.status === "fulfilled" ? filingsRes.value : [],
      insider: insiderRes.status === "fulfilled" ? insiderRes.value.rows : [],
    };
    await cacheSet(key, data);
    return data;
  } catch (e) {
    const stale = (await cacheGetStale(key)) as MonitorUsBundle | null;
    if (stale) return stale;
    throw e;
  }
}

// ── AI briefing (self-contained Gemini call — does not depend on proxy-api recovery) ──

export async function briefSignal(corpName: string, stockCode: string, reportNm: string, categoryLabel: string): Promise<{ ok: true; text: string } | { ok: false; reason: string }> {
  const key = process.env.GEMINI_KEY;
  if (!key) return { ok: false, reason: "no_key" };
  const prompt = `너는 기업 전략기획 애널리스트야. 아래 경쟁사 공시를 보고 딱 3줄로만 답해. 각 줄 라벨 유지:\n무엇이 바뀜: ...\n왜 중요: ...\n다음 할 일: ...\n\n회사: ${corpName} (${stockCode})\n공시: ${reportNm}\n전략분류: ${categoryLabel}`;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: AbortSignal.timeout(20_000),
    });
    const data = await r.json();
    if (data.error) return { ok: false, reason: data.error.code === 429 ? "rate_limit" : "api_error" };
    const txt = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return txt ? { ok: true, text: txt.trim() } : { ok: false, reason: "empty" };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export { dartFloat };
