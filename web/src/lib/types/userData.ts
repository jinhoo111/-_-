export type StockStatus = "hold" | "buy" | "watch";
export type StockStyle = "" | "short" | "long";

export interface Stock {
  name: string;
  ticker: string;
  buy: number;
  cur: number;
  qty: number;
  status: StockStatus;
  market: "kr" | "us";
  account: string;
  style: StockStyle;
  hidden?: boolean;
  marketState?: string;
}

export interface UserData {
  user_id: string;
  stocks: Stock[];
  memos: unknown[];
  memo_archive: unknown[];
  cash_krw: number;
  cash_usd: number;
  quote_symbols: string[];
  notify_master: boolean;
  invest_philosophy: unknown[];
  monitor_companies: unknown[];
  ledger: unknown[];
  health: Record<string, unknown>;
  budget: Record<string, unknown>;
  impulse_trades: unknown[];
  schedules: unknown[];
  updated_at: string;
}

export const EMPTY_USER_DATA: Omit<UserData, "user_id" | "updated_at"> = {
  stocks: [],
  memos: [],
  memo_archive: [],
  cash_krw: 0,
  cash_usd: 0,
  quote_symbols: ["NVDA", "AAPL", "TSLA", "MSFT"],
  notify_master: false,
  invest_philosophy: [],
  monitor_companies: [],
  ledger: [],
  health: {},
  budget: {},
  impulse_trades: [],
  schedules: [],
};

export function isKrTicker(ticker: string): boolean {
  return /\.(KS|KQ)$/i.test(ticker || "");
}
