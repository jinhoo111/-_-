import "server-only";
import { cacheGet, cacheGetStale, cacheSet } from "@/lib/flow/cache";
import { FLOW_INSTITUTIONS, type F13Added, type F13Changed, type F13Exited, type F13Response, type F13TopHolding, type FlowKrRank, type FlowKrRow, type FlowKrStockPoint, type InsiderTx } from "@/lib/flow/constants";

// ══ KR institutional/foreign net-buy flow ══════════════════════════════
// Source: Naver mobile API. KR investor-type flow has no official KRX OpenAPI coverage
// (KRX web stats requires a login session, unusable server-side — verified 2026-07-11).
// Swap point if a KIS (Korea Investment) API key is later obtained: replace getInvestorFlow only.
const NAVER_M = "https://m.stock.naver.com/api";
const NAVER_HEADERS = { "User-Agent": "Mozilla/5.0", Referer: "https://m.stock.naver.com/" };
const toNum = (s: unknown): number => Number(String(s ?? "").replace(/[+,%\s]/g, "")) || 0;

async function getInvestorFlow(code: string): Promise<FlowKrStockPoint[]> {
  const r = await fetch(`${NAVER_M}/stock/${code}/trend?page=1&pageSize=5`, { headers: NAVER_HEADERS });
  if (!r.ok) throw new Error(`naver_${r.status}`);
  const rows = await r.json();
  if (!Array.isArray(rows)) throw new Error("naver_bad_shape");
  return rows.map((d: Record<string, unknown>) => ({
    date: String(d.bizdate ?? ""),
    foreign: toNum(d.foreignerPureBuyQuant),
    organ: toNum(d.organPureBuyQuant),
    individual: toNum(d.individualPureBuyQuant),
    foreignHoldRatio: toNum(d.foreignerHoldRatio),
    close: toNum(d.closePrice),
    changeRate: (toNum(d.compareToPreviousClosePrice) / (toNum(d.closePrice) || 1)) * 100,
  }));
}

async function getUniverse(size: number): Promise<{ code: string; name: string }[]> {
  const out: { code: string; name: string }[] = [];
  for (let page = 1; out.length < size && page <= 20; page++) {
    const r = await fetch(`${NAVER_M}/stocks/marketValue/all?page=${page}&pageSize=100`, { headers: NAVER_HEADERS });
    if (!r.ok) break;
    const d = await r.json();
    const list = d?.stocks ?? [];
    if (!list.length) break;
    for (const s of list) {
      if (s.stockEndType === "stock" && /^\d{6}$/.test(s.itemCode)) out.push({ code: s.itemCode, name: s.stockName });
    }
  }
  return out.slice(0, size);
}

const FLOW_UNIVERSE_SIZE = 300;
const flowRankKey = () => "flow:kr:rank:v1";

function streakOf(flow: FlowKrStockPoint[], pick: (f: FlowKrStockPoint) => number): number {
  const sign = Math.sign(pick(flow[0]));
  if (!sign) return 0;
  let n = 0;
  for (const f of flow) {
    if (Math.sign(pick(f)) === sign) n++;
    else break;
  }
  return sign * n;
}

async function buildKrFlowRank(): Promise<FlowKrRank> {
  const universe = await getUniverse(FLOW_UNIVERSE_SIZE);
  const rows: FlowKrRow[] = [];
  const CONC = 5;
  for (let i = 0; i < universe.length; i += CONC) {
    const chunk = universe.slice(i, i + CONC);
    const got = await Promise.all(
      chunk.map(async (u): Promise<FlowKrRow | null> => {
        try {
          const flow = await getInvestorFlow(u.code);
          const latest = flow[0];
          if (!latest) return null;
          return {
            code: u.code,
            name: u.name,
            date: latest.date,
            close: latest.close,
            changeRate: Number(latest.changeRate.toFixed(2)),
            organ: latest.organ,
            foreign: latest.foreign,
            individual: latest.individual,
            organStreak: streakOf(flow, (f) => f.organ),
            foreignStreak: streakOf(flow, (f) => f.foreign),
          };
        } catch {
          return null;
        }
      }),
    );
    rows.push(...got.filter((r): r is FlowKrRow => r != null));
  }
  const top = (key: "organ" | "foreign", dir: 1 | -1) => [...rows].sort((a, b) => dir * (b[key] - a[key])).slice(0, 20);

  const result: FlowKrRank = {
    date: rows[0]?.date ?? "",
    universe: rows.length,
    builtAt: new Date().toISOString(),
    organBuy: top("organ", 1),
    organSell: top("organ", -1),
    foreignBuy: top("foreign", 1),
    foreignSell: top("foreign", -1),
  };
  await cacheSet(flowRankKey(), result);
  return result;
}

export async function getFlowKrRank(): Promise<FlowKrRank> {
  const cached = (await cacheGet(flowRankKey(), 12 * 3600_000)) as FlowKrRank | null;
  if (cached) return cached;
  return buildKrFlowRank();
}

export async function refreshFlowKrRank(): Promise<FlowKrRank> {
  return buildKrFlowRank();
}

export async function getFlowKrStock(code: string): Promise<FlowKrStockPoint[]> {
  const key = `flow:kr:stock:${code}`;
  const cached = (await cacheGet(key, 3600_000)) as FlowKrStockPoint[] | null;
  if (cached) return cached;
  try {
    const flow = await getInvestorFlow(code);
    await cacheSet(key, flow);
    return flow;
  } catch (e) {
    const stale = (await cacheGetStale(key)) as FlowKrStockPoint[] | null;
    if (stale) return stale;
    throw e;
  }
}

// ══ US insider trading (SEC Form 4) ═══════════════════════════════════
// Form 4 filings land within 2 business days of the trade — near-real-time signal.
// SEC requires a descriptive User-Agent; keep concurrency low and cache hard (10 min).
export const SEC_UA = { "User-Agent": "RichHub/1.0 (jinhoo9915@gmail.com)" };

// P(market buy)/S(sale) are the only transaction codes surfaced by default — A(RSU
// grant)/M(option exercise)/F(tax-withholding sale) are compensation mechanics, not
// discretionary signal.
const SEC_CODE_LABEL: Record<string, string> = { P: "매수", S: "매도", M: "옵션행사", A: "무상취득", F: "세금납부 매도", G: "증여" };

function secText(tag: string, s: string): string {
  const m = s.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].trim() : "";
}

// Form 4 numeric fields nest as <tag><value>123</value></tag> — must search for <value>
// only within the matched tag block, or an adjacent value-less field's tag boundary bleeds
// into the next field's <value> (verified bug: transaction code got replaced by a share count).
function secValue(tag: string, s: string): string {
  const block = secText(tag, s);
  if (!block) return "";
  const m = block.match(/<value>([\s\S]*?)<\/value>/);
  return m ? m[1].trim() : block.replace(/<[^>]+>/g, "").trim();
}

interface ParsedForm4 {
  symbol: string;
  issuer: string;
  owner: string;
  role: string;
  isTopExec: boolean;
  txs: Omit<InsiderTx, "symbol" | "issuer" | "owner" | "role" | "isTopExec" | "filedAt" | "url">[];
}

function parseForm4(xml: string): ParsedForm4 {
  const symbol = secText("issuerTradingSymbol", xml);
  const issuer = secText("issuerName", xml);
  const owner = secText("rptOwnerName", xml);
  const rel = secText("reportingOwnerRelationship", xml);
  const title = rel ? secText("officerTitle", rel) : "";
  const isDirector = /<isDirector>\s*(1|true)\s*<\/isDirector>/.test(rel);
  const isTenPct = /<isTenPercentOwner>\s*(1|true)\s*<\/isTenPercentOwner>/.test(rel);
  const role = title || (isDirector ? "이사" : isTenPct ? "10% 주주" : "");
  const isTopExec = /chief exec|CEO|president|chief financial|CFO/i.test(title);

  const txs = [...xml.matchAll(/<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/g)]
    .map((m) => {
      const t = m[1];
      const code = secValue("transactionCode", t) || secText("transactionCode", t);
      const shares = Number(secValue("transactionShares", t)) || 0;
      const price = Number(secValue("transactionPricePerShare", t)) || 0;
      return {
        code,
        label: SEC_CODE_LABEL[code] || code,
        date: secValue("transactionDate", t),
        shares,
        price,
        amount: Math.round(shares * price),
        sharesAfter: Number(secValue("sharesOwnedFollowingTransaction", t)) || 0,
      };
    })
    .filter((t) => t.shares > 0);

  return { symbol, issuer, owner, role, isTopExec, txs };
}

interface SecHit {
  _id: string;
  _source?: { ciks?: string[]; file_date?: string };
}

const form4Stats = { fetched: 0, httpFail: 0, noTx: 0, parsed: 0 };

async function fetchForm4Docs(hits: SecHit[]): Promise<InsiderTx[]> {
  const out: (ParsedForm4 & { filedAt: string; url: string })[] = [];
  const CONC = 4;
  for (let i = 0; i < hits.length; i += CONC) {
    const chunk = hits.slice(i, i + CONC);
    const got = await Promise.all(
      chunk.map(async (h) => {
        try {
          const [acc, doc] = String(h._id).split(":");
          const ciks = (h._source?.ciks || []).map((c) => String(c).replace(/^0+/, ""));
          let xml = "";
          for (const cik of ciks) {
            const url = `https://www.sec.gov/Archives/edgar/data/${cik}/${acc.replace(/-/g, "")}/${doc}`;
            const r = await fetch(url, { headers: SEC_UA });
            if (r.ok) {
              xml = await r.text();
              form4Stats.fetched++;
              break;
            }
            form4Stats.httpFail++;
          }
          if (!xml) return null;
          const parsed = parseForm4(xml);
          if (!parsed.symbol || !parsed.txs.length) {
            form4Stats.noTx++;
            return null;
          }
          form4Stats.parsed++;
          return { ...parsed, filedAt: h._source?.file_date || "", url: "" };
        } catch {
          return null;
        }
      }),
    );
    out.push(...got.filter((r): r is ParsedForm4 & { filedAt: string; url: string } => r != null));
    await new Promise((r) => setTimeout(r, 120));
  }
  const rows: InsiderTx[] = [];
  for (const f of out) {
    for (const t of f.txs) {
      if (t.code !== "P" && t.code !== "S") continue;
      rows.push({
        symbol: f.symbol,
        issuer: f.issuer,
        owner: f.owner,
        role: f.role,
        isTopExec: f.isTopExec,
        filedAt: f.filedAt,
        url: f.url,
        ...t,
      });
    }
  }
  return rows.sort((a, b) => b.amount - a.amount);
}

export async function getInsiderLatest(): Promise<{ builtAt: string; rows: InsiderTx[] }> {
  const key = "sec:insider:latest:v2";
  const cached = (await cacheGet(key, 10 * 60_000)) as { rows: InsiderTx[] } | null;
  if (cached?.rows?.length) return cached as { builtAt: string; rows: InsiderTx[] };
  try {
    const r = await fetch("https://efts.sec.gov/LATEST/search-index?forms=4&from=0&size=60", { headers: SEC_UA });
    if (!r.ok) throw new Error(`efts_${r.status}`);
    const hits = ((await r.json())?.hits?.hits ?? []) as SecHit[];
    const rows = await fetchForm4Docs(hits.slice(0, 40));
    const data = { builtAt: new Date().toISOString(), rows };
    if (rows.length) await cacheSet(key, data);
    return data;
  } catch (e) {
    const stale = (await cacheGetStale(key)) as { builtAt: string; rows: InsiderTx[] } | null;
    if (stale) return stale;
    throw e;
  }
}

async function getTickerCik(ticker: string): Promise<string | null> {
  let map = (await cacheGet("sec:tickers", 7 * 24 * 3600_000)) as Record<string, string> | null;
  if (!map) {
    const tr = await fetch("https://www.sec.gov/files/company_tickers.json", { headers: SEC_UA });
    if (!tr.ok) return null;
    const raw = await tr.json();
    map = {};
    for (const k of Object.keys(raw)) map[raw[k].ticker] = String(raw[k].cik_str).padStart(10, "0");
    await cacheSet("sec:tickers", map);
  }
  return map[ticker] || null;
}

export async function getInsiderStock(ticker: string): Promise<{ ticker: string; builtAt: string; rows: InsiderTx[] }> {
  const key = `sec:insider:${ticker}`;
  const cached = (await cacheGet(key, 30 * 60_000)) as { ticker: string; builtAt: string; rows: InsiderTx[] } | null;
  if (cached) return cached;
  try {
    const cik = await getTickerCik(ticker);
    if (!cik) throw new Error("ticker_not_found");
    const r = await fetch(`https://efts.sec.gov/LATEST/search-index?forms=4&ciks=${cik}&from=0&size=20`, { headers: SEC_UA });
    if (!r.ok) throw new Error(`efts_${r.status}`);
    const hits = ((await r.json())?.hits?.hits ?? []) as SecHit[];
    const rows = (await fetchForm4Docs(hits)).slice(0, 50);
    const data = { ticker, builtAt: new Date().toISOString(), rows };
    await cacheSet(key, data);
    return data;
  } catch (e) {
    const stale = (await cacheGetStale(key)) as { ticker: string; builtAt: string; rows: InsiderTx[] } | null;
    if (stale) return stale;
    throw e;
  }
}

// ══ 13F institutional holdings ═════════════════════════════════════════
// Filed within 45 days of quarter end — a lagging "what did they do last quarter" signal.
// Matching MUST be by CUSIP, never by issuer name: issuer name formatting changes quarter
// to quarter (e.g. "CHEVRON CORP NEW" -> "CHEVRON CORPORATION"), which would double-count
// the same holding as an "exit" plus a "new position".

interface HoldingMap {
  [cusip: string]: { name: string; value: number; shares: number };
}

async function fetch13fHoldings(cik: string, accession: string): Promise<HoldingMap | null> {
  const accn = accession.replace(/-/g, "");
  const base = `https://www.sec.gov/Archives/edgar/data/${cik.replace(/^0+/, "")}/${accn}`;
  const idxRes = await fetch(`${base}/`, { headers: SEC_UA });
  if (!idxRes.ok) return null;
  const idx = await idxRes.text();
  const xmls = [...idx.matchAll(/href="([^"]+\.xml)"/g)].map((m) => m[1]).filter((u) => !u.includes("primary_doc"));
  for (const x of xmls) {
    const r = await fetch(`https://www.sec.gov${x}`, { headers: SEC_UA });
    if (!r.ok) continue;
    const t = await r.text();
    if (!t.includes("infoTable")) continue;
    const map: HoldingMap = {};
    for (const m of t.matchAll(/<(?:\w+:)?infoTable>([\s\S]*?)<\/(?:\w+:)?infoTable>/g)) {
      const b = m[1];
      const pick = (tag: string) => {
        const mm = b.match(new RegExp(`<(?:\\w+:)?${tag}>([\\s\\S]*?)</(?:\\w+:)?${tag}>`));
        return mm ? mm[1].trim() : "";
      };
      const cusip = pick("cusip").toUpperCase();
      if (!cusip) continue;
      const num = (s: string) => Number(String(s).replace(/[^0-9]/g, "")) || 0;
      const cur = map[cusip] || (map[cusip] = { name: pick("nameOfIssuer"), value: 0, shares: 0 });
      cur.value += num(pick("value"));
      cur.shares += num(pick("sshPrnamt"));
    }
    if (Object.keys(map).length) return map;
  }
  return null;
}

const endPriceOf = (h: { value: number; shares: number }) => (h.shares ? Number((h.value / h.shares).toFixed(2)) : 0);

export async function getF13(id: string): Promise<F13Response> {
  const inst = FLOW_INSTITUTIONS.find((i) => i.id === id);
  if (!inst) throw new Error("institution_not_found");
  const key = `sec:13f:v2:${id}`;
  const cached = (await cacheGet(key, 24 * 3600_000)) as F13Response | null;
  if (cached) return cached;
  try {
    const sr = await fetch(`https://data.sec.gov/submissions/CIK${inst.cik}.json`, { headers: SEC_UA });
    if (!sr.ok) throw new Error(`sec_${sr.status}`);
    const sub = await sr.json();
    const rec = sub.filings?.recent ?? {};
    const f13: { acc: string; date: string; period: string }[] = [];
    for (let i = 0; i < (rec.form?.length || 0) && f13.length < 2; i++) {
      if (String(rec.form[i]).startsWith("13F-HR")) {
        f13.push({ acc: rec.accessionNumber[i], date: rec.filingDate[i], period: rec.reportDate?.[i] || "" });
      }
    }
    if (!f13.length) throw new Error("no_13f");

    const cur = await fetch13fHoldings(inst.cik, f13[0].acc);
    if (!cur) throw new Error("holdings_parse");
    const prev = f13[1] ? await fetch13fHoldings(inst.cik, f13[1].acc) : null;

    const total = Object.values(cur).reduce((s, h) => s + h.value, 0);

    const top: F13TopHolding[] = Object.entries(cur)
      .map(([cusip, h]) => ({ cusip, name: h.name, value: h.value, shares: h.shares, endPrice: endPriceOf(h), weight: total ? Number(((h.value / total) * 100).toFixed(1)) : 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);

    let added: F13Added[] = [];
    let exited: F13Exited[] = [];
    let changed: F13Changed[] = [];
    if (prev) {
      added = Object.entries(cur)
        .filter(([c]) => !prev[c])
        .map(([c, h]) => ({ cusip: c, name: h.name, value: h.value, shares: h.shares, endPrice: endPriceOf(h) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      exited = Object.entries(prev)
        .filter(([c]) => !cur[c])
        .map(([c, h]) => ({ cusip: c, name: h.name, prevValue: h.value, prevShares: h.shares, prevEndPrice: endPriceOf(h) }))
        .sort((a, b) => b.prevValue - a.prevValue)
        .slice(0, 10);
      changed = Object.entries(cur)
        .filter(([c]) => prev[c] && prev[c].shares !== cur[c].shares)
        .map(([c, h]) => {
          const p = prev[c];
          const diff = h.shares - p.shares;
          return { cusip: c, name: h.name, shares: h.shares, diff, pct: p.shares ? Number(((diff / p.shares) * 100).toFixed(1)) : 0, value: h.value, endPrice: endPriceOf(h) };
        })
        .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
        .slice(0, 10);
    }

    const data: F13Response = {
      inst: { id: inst.id, name: inst.name, who: inst.who },
      filedAt: f13[0].date,
      period: f13[0].period,
      prevFiledAt: f13[1]?.date || "",
      prevPeriod: f13[1]?.period || "",
      totalValue: total,
      count: Object.keys(cur).length,
      top,
      added,
      exited,
      changed,
    };
    await cacheSet(key, data);
    return data;
  } catch (e) {
    const stale = (await cacheGetStale(key)) as F13Response | null;
    if (stale) return stale;
    throw e;
  }
}
