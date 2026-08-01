export type SectionKey = "kr" | "us" | "vix" | "rates" | "futures" | "crypto" | "fx" | "commodities";

export const SECTION_DEFAULT: Record<SectionKey, boolean> = {
  kr: true,
  us: true,
  vix: true,
  rates: true,
  futures: false,
  crypto: false,
  fx: false,
  commodities: false,
};

export const SECTIONS: { key: SectionKey; labelKey: string }[] = [
  { key: "kr", labelKey: "indices.section.kr" },
  { key: "us", labelKey: "indices.section.us" },
  { key: "vix", labelKey: "indices.section.vix" },
  { key: "rates", labelKey: "indices.section.rates" },
  { key: "futures", labelKey: "indices.section.futures" },
  { key: "crypto", labelKey: "indices.section.crypto" },
  { key: "fx", labelKey: "indices.section.fx" },
  { key: "commodities", labelKey: "indices.section.commodities" },
];

export type IndexItem = { symbol: string; nameKey: string; naver?: string };

export const KR_INDICES: IndexItem[] = [
  { symbol: "^KS11", nameKey: "indices.name.kospi", naver: "KOSPI" },
  { symbol: "^KQ11", nameKey: "indices.name.kosdaq", naver: "KOSDAQ" },
];

export const US_INDICES: IndexItem[] = [
  { symbol: "^GSPC", nameKey: "indices.name.sp500" },
  { symbol: "^IXIC", nameKey: "indices.name.nasdaq" },
  { symbol: "^DJI", nameKey: "indices.name.dow" },
];

export const VIX_INDEX: IndexItem[] = [{ symbol: "^VIX", nameKey: "indices.name.vix" }];

export const FUTURES: IndexItem[] = [
  { symbol: "NQ=F", nameKey: "indices.name.nqFutures" },
  { symbol: "ES=F", nameKey: "indices.name.esFutures" },
  { symbol: "RTY=F", nameKey: "indices.name.rtyFutures" },
];

export const COMMODITIES: IndexItem[] = [
  { symbol: "GC=F", nameKey: "indices.name.gold" },
  { symbol: "SI=F", nameKey: "indices.name.silver" },
  { symbol: "CL=F", nameKey: "indices.name.wti" },
  { symbol: "ZW=F", nameKey: "indices.name.wheat" },
  { symbol: "HG=F", nameKey: "indices.name.copper" },
];

export const CRYPTO: { id: string; symbol: string }[] = [
  { id: "bitcoin", symbol: "BTC" },
  { id: "ethereum", symbol: "ETH" },
  { id: "solana", symbol: "SOL" },
  { id: "binancecoin", symbol: "BNB" },
];

export type FxCurrency = "KRW" | "JPY" | "EUR" | "CNY";
export const FX_PAIRS: { pair: string; currency: FxCurrency }[] = [
  { pair: "USD/KRW", currency: "KRW" },
  { pair: "USD/JPY", currency: "JPY" },
  { pair: "EUR/USD", currency: "EUR" },
  { pair: "USD/CNY", currency: "CNY" },
];

export const YIELD_CURVE_SYMBOLS = { tenYear: "^TNX", twoYear: "2YY=F" };

// Ported verbatim from index.html's IDX_LINK_MAP — external Yahoo/CoinGecko pages
// each card links out to. Keyed by ticker symbol, CoinGecko id, or FX currency code.
export const INDEX_LINK_MAP: Record<string, string> = {
  "^KS11": "https://finance.yahoo.com/quote/%5EKS11/",
  "^KQ11": "https://finance.yahoo.com/quote/%5EKQ11/",
  "^GSPC": "https://finance.yahoo.com/quote/%5EGSPC/",
  "^IXIC": "https://finance.yahoo.com/quote/%5EIXIC/",
  "^DJI": "https://finance.yahoo.com/quote/%5EDJI/",
  "^VIX": "https://finance.yahoo.com/quote/%5EVIX/",
  "NQ=F": "https://finance.yahoo.com/quote/NQ%3DF/",
  "ES=F": "https://finance.yahoo.com/quote/ES%3DF/",
  "RTY=F": "https://finance.yahoo.com/quote/RTY%3DF/",
  "GC=F": "https://finance.yahoo.com/quote/GC%3DF/",
  "SI=F": "https://finance.yahoo.com/quote/SI%3DF/",
  "CL=F": "https://finance.yahoo.com/quote/CL%3DF/",
  "ZW=F": "https://finance.yahoo.com/quote/ZW%3DF/",
  "HG=F": "https://finance.yahoo.com/quote/HG%3DF/",
  bitcoin: "https://www.coingecko.com/en/coins/bitcoin",
  ethereum: "https://www.coingecko.com/en/coins/ethereum",
  solana: "https://www.coingecko.com/en/coins/solana",
  binancecoin: "https://www.coingecko.com/en/coins/binancecoin",
  KRW: "https://finance.yahoo.com/quote/KRW%3DX/",
  JPY: "https://finance.yahoo.com/quote/JPY%3DX/",
  EUR: "https://finance.yahoo.com/quote/EURUSD%3DX/",
  CNY: "https://finance.yahoo.com/quote/CNY%3DX/",
};

// Recession leading indicator: the sign of the 10Y-2Y spread matters more than
// the 2Y level itself. Bands/thresholds ported verbatim from index.html's YC_BANDS.
export type YieldCurveBand = { min: number; labelKey: string; bar: string; bg: string; fg: string };
export const YIELD_CURVE_BANDS: YieldCurveBand[] = [
  { min: 40, labelKey: "indices.yieldCurve.band.stable", bar: "--color-success", bg: "--color-success-bg", fg: "--color-success-text" },
  { min: 10, labelKey: "indices.yieldCurve.band.mildlyStable", bar: "--color-info", bg: "--color-info-bg", fg: "--color-info" },
  { min: -10, labelKey: "indices.yieldCurve.band.mildlyUnstable", bar: "--color-warning", bg: "--color-warning-bg", fg: "--color-warning-text" },
  { min: -Infinity, labelKey: "indices.yieldCurve.band.veryUnstable", bar: "--color-error", bg: "--color-error-bg", fg: "--color-error-text" },
];

export function classifyYieldCurve(bp: number): YieldCurveBand {
  return YIELD_CURVE_BANDS.find((b) => bp >= b.min) ?? YIELD_CURVE_BANDS[YIELD_CURVE_BANDS.length - 1];
}

// All distinct Yahoo symbols needed across the currently enabled sections —
// lets the page batch every quote into one /api/market/quote call.
export function yahooSymbolsForSections(enabled: Record<SectionKey, boolean>): string[] {
  const symbols: string[] = [];
  if (enabled.kr) symbols.push(...KR_INDICES.map((i) => i.symbol));
  if (enabled.us) symbols.push(...US_INDICES.map((i) => i.symbol));
  if (enabled.vix) symbols.push(...VIX_INDEX.map((i) => i.symbol));
  if (enabled.rates) symbols.push(YIELD_CURVE_SYMBOLS.tenYear, YIELD_CURVE_SYMBOLS.twoYear);
  if (enabled.futures) symbols.push(...FUTURES.map((i) => i.symbol));
  if (enabled.commodities) symbols.push(...COMMODITIES.map((i) => i.symbol));
  return [...new Set(symbols)];
}
