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

// Per-source badge coloring for regulator feed items — ported verbatim from
// legacy REG_FEEDS_US/KR + the ad-hoc kf/uf keyword-search source objects.
// Labels here are institution short codes/proper nouns (data), not UI copy.
export const REG_SOURCE_META: Record<string, { label: string; color: string; bg: string }> = {
  ftc: { label: "FTC", color: "var(--color-error-text)", bg: "var(--color-error-bg)" },
  fed: { label: "Fed", color: "var(--color-accent-dark)", bg: "var(--color-accent-bg-soft)" },
  sec: { label: "SEC", color: "var(--color-info)", bg: "var(--color-info-bg)" },
  doj: { label: "DOJ", color: "var(--color-success-text)", bg: "var(--color-success-bg)" },
  fsc: { label: "금융위", color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
  fss: { label: "금감원", color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
  bok: { label: "한은", color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
  "kr-search": { label: "KR", color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
  "us-search": { label: "US", color: "var(--color-info)", bg: "var(--color-info-bg)" },
};

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
  desc: string;
  badge: string;
  bg: string;
  fg: string;
  cat: SiteCategory;
}

// Curated outbound links — proper nouns/URLs/descriptions/badges are data
// (ported verbatim from legacy `SITES`), not UI copy.
export const RESEARCH_SITES: ResearchSite[] = [
  { name: "JPMorgan Research", url: "https://www.jpmorgan.com/insights/research", desc: "글로벌 주식·채권·매크로", badge: "IB", bg: "var(--color-info-bg)", fg: "var(--color-info)", cat: "ib" },
  { name: "Goldman Sachs", url: "https://www.goldmansachs.com/insights/", desc: "Equity Research 공개 레포트", badge: "IB", bg: "var(--color-success-bg)", fg: "var(--color-success-dark)", cat: "ib" },
  { name: "Morgan Stanley", url: "https://www.morganstanley.com/ideas", desc: "투자 인사이트 & 리서치", badge: "IB", bg: "var(--color-accent-bg-soft)", fg: "var(--color-accent-mid)", cat: "ib" },
  { name: "BlackRock BII", url: "https://www.blackrock.com/us/individual/insights/blackrock-investment-institute", desc: "주간 매크로 아웃룩", badge: "IB", bg: "var(--color-error-bg)", fg: "var(--color-error-text)", cat: "ib" },
  { name: "BofA Research", url: "https://business.bofa.com/en-us/content/global-research.html", desc: "테마·매크로 리포트", badge: "IB", bg: "var(--color-warning-bg)", fg: "var(--color-warning-text)", cat: "ib" },
  { name: "Bloomberg", url: "https://www.bloomberg.com/markets", desc: "실시간 시세·뉴스", badge: "뉴스", bg: "var(--color-bg-muted)", fg: "var(--color-text-warm)", cat: "news" },
  { name: "WSJ Markets", url: "https://www.wsj.com/finance", desc: "애널리스트 의견 & 실적", badge: "뉴스", bg: "var(--color-bg-muted)", fg: "var(--color-text-warm)", cat: "news" },
  { name: "Reuters", url: "https://www.reuters.com/finance/", desc: "실시간 금융·M&A 속보", badge: "뉴스", bg: "var(--color-bg-muted)", fg: "var(--color-text-warm)", cat: "news" },
  { name: "CNBC Markets", url: "https://www.cnbc.com/markets/", desc: "어닝스 콜·애널리스트 콜", badge: "뉴스", bg: "var(--color-info-bg)", fg: "var(--color-info)", cat: "news" },
  { name: "FT Markets", url: "https://www.ft.com/markets", desc: "글로벌·유럽 커버리지", badge: "뉴스", bg: "var(--color-warning-bg)", fg: "var(--color-warning-deeper)", cat: "news" },
  { name: "Seeking Alpha", url: "https://seekingalpha.com/market-news/all", desc: "종목별 Bull/Bear 분석", badge: "뉴스", bg: "var(--color-success-bg)", fg: "var(--color-success-text)", cat: "news" },
  { name: "SEC EDGAR", url: "https://efts.sec.gov/LATEST/search-index?q=&forms=8-K", desc: "기업 8-K·10-K 실시간 공시", badge: "규제", bg: "var(--color-info-bg)", fg: "var(--color-info)", cat: "reg" },
  { name: "SEC 보도자료", url: "https://www.sec.gov/newsroom/press-releases", desc: "SEC 공식 제재·승인 발표", badge: "규제", bg: "var(--color-info-bg)", fg: "var(--color-info)", cat: "reg" },
  { name: "DOJ Antitrust", url: "https://www.justice.gov/atr/news", desc: "반독점·빅테크 소송 현황", badge: "규제", bg: "var(--color-error-bg)", fg: "var(--color-error-text)", cat: "reg" },
  { name: "FTC News", url: "https://www.ftc.gov/news-events/news", desc: "AI·데이터·플랫폼 규제", badge: "규제", bg: "var(--color-error-bg)", fg: "var(--color-error-text)", cat: "reg" },
  { name: "Federal Reserve", url: "https://www.federalreserve.gov/newsevents.htm", desc: "FOMC 의사록·파월 연설", badge: "규제", bg: "var(--color-info-bg)", fg: "var(--color-info-text)", cat: "reg" },
  { name: "한국 금융위", url: "https://www.fsc.go.kr/no010101", desc: "가상자산·증권 규제 발표", badge: "규제KR", bg: "var(--color-success-bg)", fg: "var(--color-success-deeper)", cat: "reg" },
  { name: "공정거래위원회", url: "https://www.ftc.go.kr/www/selectReportUserList.do?key=10", desc: "플랫폼·대기업 규제", badge: "규제KR", bg: "var(--color-success-bg)", fg: "var(--color-success-deeper)", cat: "reg" },
  { name: "Finviz", url: "https://finviz.com", desc: "섹터 히트맵·종목 스크리너", badge: "데이터", bg: "var(--color-accent-bg-soft)", fg: "var(--color-accent-dark)", cat: "data" },
  { name: "Unusual Whales", url: "https://unusualwhales.com", desc: "옵션플로우·다크풀 실시간", badge: "데이터", bg: "var(--color-warning-bg)", fg: "var(--color-warning-text)", cat: "data" },
  { name: "Fintel.io", url: "https://fintel.io", desc: "기관 13F 수급·Short Interest", badge: "데이터", bg: "var(--color-warning-bg)", fg: "var(--color-warning-text)", cat: "data" },
  { name: "GuruFocus", url: "https://www.gurufocus.com/news/index", desc: "내부자 거래·DCF 밸류에이션", badge: "데이터", bg: "var(--color-accent-bg-soft)", fg: "var(--color-accent-deeper)", cat: "data" },
  { name: "Macrotrends", url: "https://www.macrotrends.net", desc: "장기 차트·PER·EPS 히스토리", badge: "데이터", bg: "var(--color-accent-bg-soft)", fg: "var(--color-accent-dark)", cat: "data" },
  { name: "StockTitan", url: "https://www.stocktitan.net", desc: "실시간 8-K·어닝스 트랜스크립트", badge: "데이터", bg: "var(--color-accent-bg-soft)", fg: "var(--color-accent-dark)", cat: "data" },
  { name: "KIND 전자공시", url: "https://kind.krx.co.kr", desc: "KRX 국내 전 종목 실시간 공시", badge: "한국", bg: "var(--color-success-bg)", fg: "var(--color-success-deeper)", cat: "kr" },
  { name: "네이버 증권", url: "https://finance.naver.com/news/news_list.naver?mode=LSS3D&section_id=101&section_id2=258&section_id3=401", desc: "국내 기업 공시·IR 뉴스", badge: "한국", bg: "var(--color-success-bg)", fg: "var(--color-success-deeper)", cat: "kr" },
  { name: "한국경제", url: "https://www.hankyung.com/finance", desc: "국내 증시·증권사 리포트 요약", badge: "한국", bg: "var(--color-success-bg)", fg: "var(--color-success-text)", cat: "kr" },
  { name: "fnguide 리서치", url: "https://www.fnguide.com/home/Research", desc: "국내 증권사 목표가·투자의견", badge: "한국", bg: "var(--color-success-bg)", fg: "var(--color-success-text)", cat: "kr" },
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
