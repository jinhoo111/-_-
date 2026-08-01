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

export type MemoTag = "general" | "buy" | "sell" | "monitor" | "flow";

export interface MonitorMemoSource {
  type: "monitor";
  corp_code: string;
  corp_name: string;
  disclosure_title?: string;
  disclosure_date?: string;
}

export interface MemoArchiveEntry {
  id: string;
  text: string;
  tag: MemoTag;
  time: string;
  completedAt: string;
  important?: boolean;
  source?: FlowAlertMemoSource | MonitorMemoSource;
}

export interface MarketEvent {
  id: string;
  date: string;
  type: string;
  title: string;
}

export interface ScheduleEntry {
  id: string;
  date: string;
  time: string;
  title: string;
  memo?: string;
}

export type LedgerType = "income" | "expense";

export interface LedgerEntry {
  id: string;
  date: string;
  type: LedgerType;
  amount: number;
  cat: string;
  memo?: string;
}

export interface WeightEntry {
  date: string;
  kg: number;
}

export type GlucoseSlot = "fasting" | "beforeMeal" | "afterMeal2" | "bedtime" | "random";

export interface GlucoseEntry {
  date: string;
  slot: GlucoseSlot;
  mgdl: number;
}

export interface Health {
  goal: number | null;
  entries: WeightEntry[];
  monthlyGoals: Record<string, number>;
  weeklyActual: Record<string, (number | null)[]>;
  workouts: Record<string, "done" | "off">;
  glucose: GlucoseEntry[];
  glucoseGoals: Record<string, number>;
}

export interface BudgetMonth {
  income: number | null;
  expense: number | null;
  incomeWeeks?: (number | null)[];
  expenseWeeks?: (number | null)[];
}

export type Budget = Record<string, BudgetMonth>;

export interface ImpulseTradeEntry {
  id: string;
  date: string;
  reason: string;
  createdAt: string;
}

export interface FlowAlertMemoSource {
  type: "flow";
  code: string;
  name: string;
  organStreak: number;
}

export type MonitorMarket = "KOSPI" | "KOSDAQ" | "KONEX" | "기타" | "US";
export type SignalWeight = "high" | "mid" | "low";

export interface MonitorSignal {
  rcept_no: string;
  date: string;
  report_nm: string;
  category: string;
  weight: SignalWeight;
}

export interface MonitorMemo {
  id: number;
  text: string;
  time: string;
  source?: { disclosure_title: string; disclosure_date: string } | null;
  journalId?: number;
}

export interface MonitorCompany {
  corp_code: string;
  corp_name: string;
  stock_code: string;
  market: MonitorMarket;
  alert: boolean;
  lastCheckedAt: string | null;
  addedAt: string;
  memos: MonitorMemo[];
  signals?: MonitorSignal[];
  alertedNos?: string[];
  cik?: string;
  exchange?: string;
}

export type PhilosophyType = "must" | "never";

export interface PhilosophyEntry {
  id: string;
  text: string;
  type: PhilosophyType;
  sourceId: string;
  createdAt: string;
}

export interface UserData {
  user_id: string;
  stocks: Stock[];
  memos: unknown[];
  memo_archive: MemoArchiveEntry[];
  cash_krw: number;
  cash_usd: number;
  quote_symbols: string[];
  notify_master: boolean;
  invest_philosophy: PhilosophyEntry[];
  monitor_companies: MonitorCompany[];
  ledger: LedgerEntry[];
  health: Health;
  budget: Budget;
  impulse_trades: ImpulseTradeEntry[];
  schedules: ScheduleEntry[];
  indices_settings: Record<string, boolean>;
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
  health: { goal: null, entries: [], monthlyGoals: {}, weeklyActual: {}, workouts: {}, glucose: [], glucoseGoals: {} },
  budget: {},
  impulse_trades: [],
  schedules: [],
  indices_settings: { kr: true, us: true, vix: true, rates: true, futures: false, crypto: false, fx: false, commodities: false },
};

export function isKrTicker(ticker: string): boolean {
  return /\.(KS|KQ)$/i.test(ticker || "");
}
