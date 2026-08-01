// Ported from legacy `index.html`'s News/Research pages (REG_FEEDS_US/KR, SITES).
// Google News RSS is used as a proxy source for regulators without a native feed —
// FTC and the Fed have real RSS; SEC/DOJ/금융위/금감원/한국은행 do not.

export interface RegFeedSource {
  key: string;
  labelKey: string;
  url: string;
}

export const REG_FEEDS_US: RegFeedSource[] = [
  { key: "ftc", labelKey: "research.reg.us.ftc", url: "https://www.ftc.gov/feeds/press-release.xml" },
  { key: "fed", labelKey: "research.reg.us.fed", url: "https://www.federalreserve.gov/feeds/press_all.xml" },
  {
    key: "sec",
    labelKey: "research.reg.us.sec",
    url: "https://news.google.com/rss/search?q=SEC+enforcement+securities+regulation&hl=en-US&gl=US&ceid=US:en",
  },
  {
    key: "doj",
    labelKey: "research.reg.us.doj",
    url: "https://news.google.com/rss/search?q=DOJ+antitrust+regulation+enforcement&hl=en-US&gl=US&ceid=US:en",
  },
];

export const REG_FEEDS_KR: RegFeedSource[] = [
  {
    key: "fsc",
    labelKey: "research.reg.kr.fsc",
    url: "https://news.google.com/rss/search?q=" + encodeURIComponent("금융위원회 규제") + "&hl=ko&gl=KR&ceid=KR:ko",
  },
  {
    key: "fss",
    labelKey: "research.reg.kr.fss",
    url: "https://news.google.com/rss/search?q=" + encodeURIComponent("금융감독원 규제") + "&hl=ko&gl=KR&ceid=KR:ko",
  },
  {
    key: "bok",
    labelKey: "research.reg.kr.bok",
    url: "https://news.google.com/rss/search?q=" + encodeURIComponent("한국은행 금융정책") + "&hl=ko&gl=KR&ceid=KR:ko",
  },
];

export function regKeywordUrls(keyword: string): { us: string; kr: string } {
  return {
    kr: `https://news.google.com/rss/search?q=${encodeURIComponent(keyword + " 규제")}&hl=ko&gl=KR&ceid=KR:ko`,
    us: `https://news.google.com/rss/search?q=${encodeURIComponent(keyword + " regulation")}&hl=en-US&gl=US&ceid=US:en`,
  };
}

// Regulator/quick-link homepages — plain outbound links, not fetched.
export interface QuickLink {
  key: string;
  labelKey: string;
  url: string;
}

export const REG_QUICK_LINKS_US: QuickLink[] = [
  { key: "sec", labelKey: "research.reg.us.sec", url: "https://www.sec.gov" },
  { key: "finra", labelKey: "research.reg.us.finra", url: "https://www.finra.org" },
  { key: "ftc", labelKey: "research.reg.us.ftc", url: "https://www.ftc.gov" },
  { key: "doj", labelKey: "research.reg.us.doj", url: "https://www.justice.gov" },
  { key: "fed", labelKey: "research.reg.us.fed", url: "https://www.federalreserve.gov" },
  { key: "cftc", labelKey: "research.reg.us.cftc", url: "https://www.cftc.gov" },
];

export const REG_QUICK_LINKS_KR: QuickLink[] = [
  { key: "fsc", labelKey: "research.reg.kr.fsc", url: "https://www.fsc.go.kr" },
  { key: "fss", labelKey: "research.reg.kr.fss", url: "https://www.fss.or.kr" },
  { key: "krx", labelKey: "research.reg.kr.krx", url: "https://www.krx.co.kr" },
  { key: "ftckr", labelKey: "research.reg.kr.ftc", url: "https://www.ftc.go.kr" },
  { key: "bok", labelKey: "research.reg.kr.bok", url: "https://www.bok.or.kr" },
  { key: "dart", labelKey: "research.reg.kr.dart", url: "https://dart.fss.or.kr" },
];

export type SiteCategory = "ib" | "news" | "reg" | "data" | "kr";

export interface ResearchSite {
  name: string;
  url: string;
  cat: SiteCategory;
}

// Curated outbound links — proper nouns/URLs, not UI copy.
export const RESEARCH_SITES: ResearchSite[] = [
  { name: "JPMorgan", url: "https://www.jpmorgan.com/insights", cat: "ib" },
  { name: "Goldman Sachs", url: "https://www.goldmansachs.com/insights", cat: "ib" },
  { name: "Morgan Stanley", url: "https://www.morganstanley.com/ideas", cat: "ib" },
  { name: "BlackRock", url: "https://www.blackrock.com/us/individual/insights", cat: "ib" },
  { name: "Bank of America", url: "https://www.bofa.com/en-us/content/global-research.html", cat: "ib" },
  { name: "Bloomberg", url: "https://www.bloomberg.com", cat: "news" },
  { name: "Wall Street Journal", url: "https://www.wsj.com", cat: "news" },
  { name: "Reuters", url: "https://www.reuters.com", cat: "news" },
  { name: "CNBC", url: "https://www.cnbc.com", cat: "news" },
  { name: "Financial Times", url: "https://www.ft.com", cat: "news" },
  { name: "Seeking Alpha", url: "https://seekingalpha.com", cat: "news" },
  { name: "SEC EDGAR", url: "https://www.sec.gov/cgi-bin/browse-edgar", cat: "reg" },
  { name: "SEC Press Releases", url: "https://www.sec.gov/news/pressreleases", cat: "reg" },
  { name: "DOJ Antitrust", url: "https://www.justice.gov/atr", cat: "reg" },
  { name: "FTC News", url: "https://www.ftc.gov/news-events", cat: "reg" },
  { name: "Federal Reserve", url: "https://www.federalreserve.gov", cat: "reg" },
  { name: "금융위원회", url: "https://www.fsc.go.kr", cat: "reg" },
  { name: "공정거래위원회", url: "https://www.ftc.go.kr/www/selectReportUserList.do?key=10", cat: "reg" },
  { name: "Finviz", url: "https://finviz.com", cat: "data" },
  { name: "Unusual Whales", url: "https://unusualwhales.com", cat: "data" },
  { name: "Fintel.io", url: "https://fintel.io", cat: "data" },
  { name: "GuruFocus", url: "https://www.gurufocus.com", cat: "data" },
  { name: "Macrotrends", url: "https://www.macrotrends.net", cat: "data" },
  { name: "StockTitan", url: "https://www.stocktitan.net", cat: "data" },
  { name: "KIND", url: "https://kind.krx.co.kr", cat: "kr" },
  { name: "네이버 증권", url: "https://finance.naver.com", cat: "kr" },
  { name: "한국경제", url: "https://www.hankyung.com", cat: "kr" },
  { name: "fnguide", url: "http://comp.fnguide.com", cat: "kr" },
];

export interface RssItem {
  title: string;
  link: string;
  summary: string;
  date: string;
  source: string;
}

export interface NewsItem {
  headline: string;
  summary: string;
  url: string;
  source: string;
  datetime: number;
  related?: string;
}

// Shared cache TTLs — mirrors legacy market-data SHARED_FH_TTL_MS / PUBLIC_NEWS_TTL_MS.
export const PUBLIC_NEWS_TTL_MS = 60_000;
export const COMPANY_NEWS_TTL_MS = 300_000;
export const RATING_TTL_MS = 3_600_000;
export const QUOTE_TTL_MS = 30_000;
export const REG_FEED_TTL_MS = 300_000;
