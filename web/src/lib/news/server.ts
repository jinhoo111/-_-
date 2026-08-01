import "server-only";
import { cacheGet, cacheGetStale, cacheSet } from "@/lib/flow/cache";
import { COMPANY_NEWS_TTL_MS, PUBLIC_NEWS_TTL_MS, RATING_TTL_MS, type NewsItem, type RssItem } from "@/lib/news/constants";

const FINNHUB_BASE = "https://finnhub.io/api/v1";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function finnhubKey(): string {
  const key = process.env.OWNER_FINNHUB_KEY;
  if (!key) throw new Error("finnhub_key_missing");
  return key;
}

async function fhFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ ...params, token: finnhubKey() });
  const r = await fetch(`${FINNHUB_BASE}/${path}?${qs}`, { signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error(`finnhub_http_${r.status}`);
  return r.json();
}

// ── Public market news (category, no auth needed by callers) ──
export async function getMarketNews(category: string): Promise<NewsItem[]> {
  const key = `news:public:${category}`;
  const cached = await cacheGet(key, PUBLIC_NEWS_TTL_MS);
  if (cached) return cached as NewsItem[];
  try {
    const data = await fhFetch<NewsItem[]>("news", { category });
    const items = Array.isArray(data) ? data.slice(0, 20) : [];
    await cacheSet(key, items);
    return items;
  } catch (e) {
    const stale = await cacheGetStale(key);
    if (stale) return stale as NewsItem[];
    throw e;
  }
}

// ── Per-ticker company news ──
export async function getCompanyNews(symbol: string): Promise<NewsItem[]> {
  const key = `news:company:${symbol}`;
  const cached = await cacheGet(key, COMPANY_NEWS_TTL_MS);
  if (cached) return cached as NewsItem[];
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10);
  try {
    const data = await fhFetch<NewsItem[]>("company-news", { symbol, from, to });
    const items = Array.isArray(data) ? data.slice(0, 20) : [];
    await cacheSet(key, items);
    return items;
  } catch (e) {
    const stale = await cacheGetStale(key);
    if (stale) return stale as NewsItem[];
    throw e;
  }
}

export interface RecommendationTrend {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

export interface PriceTarget {
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
}

export interface AnalystRating {
  recommendation: RecommendationTrend[];
  priceTarget: PriceTarget | null;
}

// ── Wall-Street ratings + price target (paired, cached together) ──
export async function getAnalystRating(symbol: string): Promise<AnalystRating> {
  const key = `news:rating:${symbol}`;
  const cached = await cacheGet(key, RATING_TTL_MS);
  if (cached) return cached as AnalystRating;
  try {
    const [rec, pt] = await Promise.allSettled([
      fhFetch<Record<string, unknown>[]>("stock/recommendation", { symbol }),
      fhFetch<Record<string, unknown>>("stock/price-target", { symbol }),
    ]);
    const recommendation: RecommendationTrend[] =
      rec.status === "fulfilled" && Array.isArray(rec.value)
        ? rec.value.slice(0, 3).map((r) => ({
            period: String(r.period ?? ""),
            strongBuy: Number(r.strongBuy ?? 0),
            buy: Number(r.buy ?? 0),
            hold: Number(r.hold ?? 0),
            sell: Number(r.sell ?? 0),
            strongSell: Number(r.strongSell ?? 0),
          }))
        : [];
    const ptData = pt.status === "fulfilled" ? pt.value : null;
    const priceTarget: PriceTarget | null =
      ptData && typeof ptData.targetMean === "number"
        ? {
            targetHigh: Number(ptData.targetHigh ?? 0),
            targetLow: Number(ptData.targetLow ?? 0),
            targetMean: Number(ptData.targetMean ?? 0),
            targetMedian: Number(ptData.targetMedian ?? 0),
          }
        : null;
    const result: AnalystRating = { recommendation, priceTarget };
    await cacheSet(key, result);
    return result;
  } catch (e) {
    const stale = await cacheGetStale(key);
    if (stale) return stale as AnalystRating;
    throw e;
  }
}

// ── Generic RSS proxy (Google News, FTC, Fed) with browser-like headers + timeout ──
export async function fetchRssXml(url: string): Promise<string> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
      },
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`upstream_${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(tid);
  }
}

// Minimal RSS 2.0 <item>/Atom <entry> parser — server has no DOMParser, use regex
// extraction instead (matches legacy's title/summary/link/date field set).
export function parseRssItems(xml: string, source: string, limit = 8): RssItem[] {
  const items: RssItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/g) ?? [];
  for (const block of blocks.slice(0, limit)) {
    const pick = (tag: string): string => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      if (!m) return "";
      return m[1]
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
        .replace(/<[^>]+>/g, "")
        .trim();
    };
    const linkAttr = block.match(/<link[^>]*href="([^"]+)"/i);
    const link = pick("link") || (linkAttr ? linkAttr[1] : "");
    const title = pick("title");
    if (!title) continue;
    items.push({
      title,
      link,
      summary: pick("description") || pick("summary"),
      date: pick("pubDate") || pick("published") || pick("updated"),
      source,
    });
  }
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return items;
}

// ── Naver stock news (CORS-bypass proxy) ──
export async function getNaverStockNews(code: string): Promise<unknown> {
  const url = `https://m.stock.naver.com/api/news/stock/${code}?pageSize=5`;
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Referer: "https://m.stock.naver.com/", Accept: "application/json" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!r.ok) throw new Error(`naver_news_${r.status}`);
  return r.json();
}
