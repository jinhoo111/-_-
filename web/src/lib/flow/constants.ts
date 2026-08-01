// Fixed 13F "smart money" watchlist — ported verbatim from legacy `_f13Insts`/`INSTITUTIONS`.
// `who` labels are the manager's Korean name — data (proper noun), not UI copy.
export interface FlowInstitution {
  id: string;
  cik: string;
  name: string;
  who: string;
}

export const FLOW_INSTITUTIONS: FlowInstitution[] = [
  { id: "brk", cik: "0001067983", name: "버크셔 해서웨이", who: "워런 버핏" },
  { id: "ark", cik: "0001697748", name: "ARK Invest", who: "캐시 우드" },
  { id: "psq", cik: "0001336528", name: "퍼싱 스퀘어", who: "빌 애크먼" },
  { id: "scion", cik: "0001649339", name: "사이언 자산운용", who: "마이클 버리" },
  { id: "bw", cik: "0001350694", name: "브리지워터", who: "레이 달리오" },
  { id: "tiger", cik: "0001167483", name: "타이거 글로벌", who: "체이스 콜먼" },
  { id: "duq", cik: "0001536411", name: "듀케인 패밀리", who: "스탠리 드러켄밀러" },
  { id: "app", cik: "0001056188", name: "아팔루사", who: "데이비드 테퍼" },
];

// KR flow: institution consecutive net-sell days before a portfolio warning fires.
export const FLOW_WARN_DAYS = 2;

export interface FlowKrRow {
  code: string;
  name: string;
  date: string;
  close: number;
  changeRate: number;
  organ: number;
  foreign: number;
  individual?: number;
  organStreak: number;
  foreignStreak: number;
}

export interface FlowKrRank {
  date: string;
  universe: number;
  builtAt: string;
  organBuy: FlowKrRow[];
  organSell: FlowKrRow[];
  foreignBuy: FlowKrRow[];
  foreignSell: FlowKrRow[];
}

export interface FlowKrStockPoint {
  date: string;
  foreign: number;
  organ: number;
  individual: number;
  foreignHoldRatio: number;
  close: number;
  changeRate: number;
}

export interface InsiderTx {
  symbol: string;
  issuer: string;
  owner: string;
  role: string;
  isTopExec: boolean;
  filedAt: string;
  url: string;
  code: string;
  label: string;
  date: string;
  shares: number;
  price: number;
  amount: number;
  sharesAfter: number;
}

export interface InsiderLatest {
  builtAt: string;
  rows: InsiderTx[];
}

export interface InsiderStock {
  ticker: string;
  builtAt: string;
  rows: InsiderTx[];
}

export interface F13TopHolding {
  cusip: string;
  name: string;
  value: number;
  shares: number;
  endPrice: number;
  weight: number;
}

export interface F13Added {
  cusip: string;
  name: string;
  value: number;
  shares: number;
  endPrice: number;
}

export interface F13Exited {
  cusip: string;
  name: string;
  prevValue: number;
  prevShares: number;
  prevEndPrice: number;
}

export interface F13Changed {
  cusip: string;
  name: string;
  shares: number;
  diff: number;
  pct: number;
  value: number;
  endPrice: number;
}

export interface F13Response {
  inst: { id: string; name: string; who: string };
  filedAt: string;
  period: string;
  prevFiledAt: string;
  prevPeriod: string;
  totalValue: number;
  count: number;
  top: F13TopHolding[];
  added: F13Added[];
  exited: F13Exited[];
  changed: F13Changed[];
}

export function f13Money(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${Math.round(v).toLocaleString()}`;
}
