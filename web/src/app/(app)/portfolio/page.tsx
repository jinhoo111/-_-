"use client";

import { useMemo, useState } from "react";
import { useUserData, useUpdateUserData } from "@/lib/queries/useUserData";
import { useQuotes } from "@/lib/queries/useQuotes";
import { useFxRates } from "@/lib/queries/useIndices";
import { useDisplayPrefs, CURRENCIES, type CurrencyCode } from "@/lib/displayPrefs";
import { isKrTicker, type Stock, type StockStatus, type StockStyle } from "@/lib/types/userData";
import {
  ACCOUNT_LIST,
  STATUS_LABEL_KEY,
  STYLE_LABEL_KEY,
  STYLE_ABBR_KEY,
  acctColor,
  resolveTickerFromName,
  type TickerSearchResult,
} from "@/lib/portfolio/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TickerSearchInput } from "@/components/portfolio/TickerSearchInput";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { PriceChange } from "@/components/ui/PriceChange";
import { Sparkline } from "@/components/ui/Sparkline";
import { TickerRow } from "@/components/ui/TickerRow";
import { Badge } from "@/components/ui/Badge";
import { RangeDropdown, RANGE_KEYS, type RangeKey } from "@/components/ui/RangeDropdown";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/LanguageProvider";
import { FlowBar } from "@/components/home/FlowBar";
import { CompetitorBriefCard } from "@/components/home/CompetitorBriefCard";
import { TechSignalScanner } from "@/components/home/TechSignalScanner";
import { PortfolioNewsSection } from "@/components/home/PortfolioNewsSection";

const MARKET_STATE_KEY: Record<string, string> = {
  PRE: "market.state.pre",
  POST: "market.state.after",
  REGULAR: "market.state.delayed",
  CLOSED: "market.state.close",
};

// Range-dropdown config: synthetic change factor + point count per range, so the
// hero behaves like the mockup (range changes the % / delta / sparkline).
const RANGE_FACTOR: Record<string, { f: number; pts: number }> = {
  "1D": { f: 0.06, pts: 9 },
  "7D": { f: 0.18, pts: 7 },
  "1M": { f: 0.4, pts: 10 },
  "3M": { f: 0.7, pts: 10 },
  "9M": { f: 1.2, pts: 10 },
  YTD: { f: 1.1, pts: 10 },
  "1Y": { f: 1.5, pts: 12 },
  All: { f: 2.0, pts: 13 },
};

const RANGE_NAME_KEY: Record<string, string> = {
  "1D": "portfolio.range.1d",
  "7D": "portfolio.range.7d",
  "1M": "portfolio.range.1m",
  "3M": "portfolio.range.3m",
  "9M": "portfolio.range.9m",
  YTD: "portfolio.range.ytd",
  "1Y": "portfolio.range.1y",
  All: "portfolio.range.all",
};

function syntheticSeries(endValue: number, changeFactor: number, n = 10): number[] {
  const start = endValue / (1 + changeFactor / 100);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const wobble = Math.sin(i * 1.7) * 0.008 + Math.cos(i * 0.9) * 0.006;
    out.push(start + (endValue - start) * t + (endValue * wobble));
  }
  return out;
}

type StatusFilter = "all" | "hidden" | StockStatus;
type MarketFilter = "all" | "kr" | "us";
type StyleFilter = "all" | StockStyle;

function fmtUSD(n: number) {
  return "$" + Math.round(n).toLocaleString();
}
function fmtKRW(n: number) {
  return "₩" + Math.round(n).toLocaleString();
}
function fmtPrice(n: number, isKR: boolean) {
  return isKR ? fmtKRW(n) : "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PortfolioPage() {
  const t = useT();
  const { data: userData, isLoading } = useUserData();
  const updateUserData = useUpdateUserData();
  const { currency, setCurrency } = useDisplayPrefs();
  const { data: fxRates } = useFxRates(true);
  const fxRate = fxRates?.KRW ?? 1400;
  const toast = useToast();
  const [range, setRange] = useState<string>("1M");
  const [addOpen, setAddOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("all");
  const [styleFilter, setStyleFilter] = useState<StyleFilter>("all");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [addForm, setAddForm] = useState({
    name: "",
    ticker: "",
    buy: "",
    qty: "1",
    cur: "",
    marketOverride: "auto" as "auto" | "kr" | "us",
    status: "hold" as StockStatus,
  });
  const [addError, setAddError] = useState("");
  const [addPending, setAddPending] = useState(false);
  const [cashEditing, setCashEditing] = useState<"krw" | "usd" | null>(null);
  const [cashDraft, setCashDraft] = useState("");
  const [sortKey, setSortKey] = useState<"qty" | "value" | "return" | "weight" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const stocks = useMemo(() => userData?.stocks ?? [], [userData]);
  const tickers = useMemo(() => stocks.filter((s) => !s.hidden).map((s) => s.ticker), [stocks]);
  const { isFetching: quotesFetching, refetch: refetchQuotes } = useQuotes(tickers);

  if (isLoading || !userData) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  function patchStocks(next: Stock[]) {
    updateUserData({ stocks: next });
  }

  async function handleRefresh() {
    const result = await refetchQuotes();
    if (result.data) {
      const next = stocks.map((s) => {
        const q = result.data![s.ticker];
        if (!q) return s;
        return { ...s, cur: q.price, marketState: q.state };
      });
      patchStocks(next);
    }
  }

  async function handleAddStock() {
    setAddError("");
    const name = addForm.name.trim();
    const buy = parseFloat(addForm.buy);
    if (!name || isNaN(buy)) {
      setAddError(t("portfolio.addStock.fillRequired"));
      return;
    }
    const qty = parseInt(addForm.qty) || 1;
    let ticker = addForm.ticker.trim().toUpperCase() || resolveTickerFromName(name) || name.toUpperCase();
    if (/^\d{6}$/.test(ticker)) ticker += ".KS";
    const inferredKr = isKrTicker(ticker);
    const market = addForm.marketOverride === "auto" ? (inferredKr ? "kr" : "us") : addForm.marketOverride;

    setAddPending(true);
    const newStock: Stock = { name, ticker, buy, cur: 0, qty, status: addForm.status, market, account: "기타", style: "" };

    const manualCur = parseFloat(addForm.cur);
    if (!isNaN(manualCur) && manualCur > 0) {
      newStock.cur = manualCur;
    } else {
      try {
        const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(ticker)}`);
        const data = await res.json();
        const q = data?.[ticker];
        if (q) {
          newStock.cur = q.price;
          newStock.marketState = q.state;
        }
      } catch {
        // fall through — cur stays 0, user can edit manually
      }
    }
    setAddPending(false);

    if (newStock.cur === 0) {
      setAddError(t("portfolio.addStock.quoteFailed", { ticker }));
    }
    patchStocks([...stocks, newStock]);
    setAddForm({ name: "", ticker: "", buy: "", qty: "1", cur: "", marketOverride: "auto", status: "hold" });
    toast.show(t("portfolio.addStock.added", { name }), "success");
  }

  function handleStartCashEdit(which: "krw" | "usd") {
    setCashDraft(String(which === "krw" ? userData?.cash_krw || 0 : userData?.cash_usd || 0));
    setCashEditing(which);
  }
  function handleSaveCash() {
    if (!cashEditing) return;
    const v = parseFloat(cashDraft);
    const value = isNaN(v) ? 0 : v;
    updateUserData(cashEditing === "krw" ? { cash_krw: value } : { cash_usd: value });
    setCashEditing(null);
  }
  function handleSort(key: "qty" | "value" | "return" | "weight") {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function handlePickTicker(r: TickerSearchResult) {
    setAddForm((f) => ({ ...f, name: r.name, ticker: r.symbol }));
  }

  function handleRemove(i: number) {
    setEditingIdx(null);
    patchStocks(stocks.filter((_, idx) => idx !== i));
  }
  function handleToggleHidden(i: number, hidden: boolean) {
    patchStocks(stocks.map((s, idx) => (idx === i ? { ...s, hidden } : s)));
  }
  function handleSaveEdit(i: number, patch: Partial<Stock>) {
    patchStocks(stocks.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
    setEditingIdx(null);
  }

  const toUSD = (s: Stock) => (isKrTicker(s.ticker) ? (s.cur * s.qty) / fxRate : s.cur * s.qty);
  const toBuyUSD = (s: Stock) => (isKrTicker(s.ticker) ? (s.buy * s.qty) / fxRate : s.buy * s.qty);
  const held = stocks.filter((s) => s.status === "hold" && !s.hidden);
  const totalValueUSD = held.reduce((sum, s) => sum + toUSD(s), 0);
  const totalBuyUSD = held.reduce((sum, s) => sum + toBuyUSD(s), 0);
  const profitUSD = totalValueUSD - totalBuyUSD;
  const profitRate = totalBuyUSD ? (profitUSD / totalBuyUSD) * 100 : 0;
  const cashTotalUSD = (userData.cash_usd || 0) + (userData.cash_krw || 0) / fxRate;
  const grandTotalUSD = totalValueUSD + cashTotalUSD;

  const ratePerUSD: Record<CurrencyCode, number> = {
    USD: 1,
    KRW: fxRate,
    JPY: fxRates?.JPY ?? 0,
    EUR: fxRates?.EUR ? 1 / fxRates.EUR : 0,
    CNY: fxRates?.CNY ?? 0,
  };
  const fmtTop = (n: number) => {
    const rate = ratePerUSD[currency] || 1;
    const v = n * rate;
    if (currency === "KRW") return "₩" + Math.round(v).toLocaleString();
    if (currency === "JPY") return "¥" + Math.round(v).toLocaleString();
    if (currency === "CNY") return "CN¥" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (currency === "EUR") return "€" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return "$" + Math.round(v).toLocaleString();
  };

  const addBuyTicker = addForm.ticker.trim().toUpperCase() || resolveTickerFromName(addForm.name.trim()) || "";
  const addBuyCurrency = isKrTicker(addBuyTicker) ? "₩" : "$";

  const filtered = stocks
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => {
      const sm = isKrTicker(s.ticker) ? "kr" : "us";
      if (statusFilter === "hidden") {
        return !!s.hidden && (marketFilter === "all" || sm === marketFilter) && (styleFilter === "all" || (s.style || "") === styleFilter);
      }
      return (
        !s.hidden &&
        (statusFilter === "all" || s.status === statusFilter) &&
        (marketFilter === "all" || sm === marketFilter) &&
        (styleFilter === "all" || (s.style || "") === styleFilter)
      );
    });

  function sortMetric(s: Stock, key: "qty" | "value" | "return" | "weight") {
    const isKR = isKrTicker(s.ticker);
    const v = s.cur * s.qty;
    const vUSD = isKR ? v / fxRate : v;
    switch (key) {
      case "qty":
        return s.qty;
      case "value":
        return vUSD;
      case "return":
        return s.buy ? ((s.cur - s.buy) / s.buy) * 100 : 0;
      case "weight":
        return totalValueUSD ? (vUSD / totalValueUSD) * 100 : 0;
    }
  }

  if (sortKey) {
    filtered.sort((a, b) => {
      const av = sortMetric(a.s, sortKey);
      const bv = sortMetric(b.s, sortKey);
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }

  function sortIndicator(key: "qty" | "value" | "return" | "weight") {
    if (sortKey !== key) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("portfolio.title")}
        subtitle={t("portfolio.subtitle")}
        action={
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            aria-label={t("prefs.currency.title")}
            className="h-9 shrink-0 cursor-pointer rounded-[var(--radius-pill)] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 text-[var(--text-sm)] text-[var(--text-primary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-2)] focus:border-[var(--border-focus)] focus:outline-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} · {t(c.labelKey)}
              </option>
            ))}
          </select>
        }
      />

      {/* Hero: 2fr / 1fr — big total card + stacked compact cards (mockup) */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[2fr_1fr]">
        <StatCard
          label={t("portfolio.totalValue")}
          value={grandTotalUSD ? fmtTop(grandTotalUSD) : "—"}
          action={
            <RangeDropdown
              value={(range as RangeKey) ?? "1M"}
              onChange={setRange}
              names={Object.fromEntries(RANGE_KEYS.map((k) => [k, t(RANGE_NAME_KEY[k])])) as Record<RangeKey, string>}
            />
          }
          change={
            <span className="inline-flex items-center gap-2.5">
              <PriceChange value={profitRate * (RANGE_FACTOR[range]?.f ?? 0.4)} badge />
              <span className="font-mono text-[var(--text-sm)] text-[var(--text-secondary)]">
                {(profitUSD * (RANGE_FACTOR[range]?.f ?? 0.4) >= 0 ? "+" : "−") + fmtTop(Math.abs(profitUSD * (RANGE_FACTOR[range]?.f ?? 0.4)))}
              </span>
            </span>
          }
          note={t("portfolio.hero.note")}
          spark={
            <Sparkline
              data={syntheticSeries(grandTotalUSD || 1, profitRate * (RANGE_FACTOR[range]?.f ?? 0.4), RANGE_FACTOR[range]?.pts ?? 10)}
              height={88}
            />
          }
        />
        <div className="flex flex-col gap-4">
          <StatCard
            label={t("portfolio.totalProfit")}
            value={totalValueUSD ? (profitUSD >= 0 ? "+" : "−") + fmtTop(Math.abs(profitUSD)) : "—"}
            change={<PriceChange value={profitRate} badge />}
            note={t("portfolio.hero.pnlNote")}
            className="flex-1"
          />
          <StatCard
            label={t("portfolio.cashAvailable")}
            value={fmtTop(cashTotalUSD)}
            note={t("portfolio.hero.readyToInvest")}
            action={<Button size="sm" variant="secondary" onClick={() => handleStartCashEdit("krw")}>{t("portfolio.hero.manageCash")}</Button>}
            className="flex-1"
          />
        </div>
      </div>

      {/* Holdings (3fr) + Allocation / Next step (2fr) — mockup */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[3fr_2fr]">
        <Card
          className="flex flex-col gap-1 px-5 py-4"
        >
          <div className="mb-2 flex items-center justify-between gap-4">
            <div>
              <div className="font-display text-[var(--text-lg)] font-semibold tracking-[var(--tracking-heading)] text-[var(--text-primary)]">
                {t("portfolio.holdings")}
              </div>
              <div className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
                {t("portfolio.holdings.subtitle", { count: held.length })}
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
              {t("portfolio.addInvestment")}
            </Button>
          </div>
          <div className="flex flex-col">
            {held.length === 0 ? (
              <EmptyState title={t("portfolio.empty.title")} description={t("portfolio.empty.description")} />
            ) : (
              held.map((s, heldIdx) => (
                <TickerRow
                  key={`${s.ticker}-${s.name}-${heldIdx}`}
                  symbol={s.name}
                  name={s.name}
                  sub={`${s.qty} ${t("portfolio.hero.shares")} · ${isKrTicker(s.ticker) ? fmtKRW(s.cur) : fmtUSD(s.cur)}`}
                  value={isKrTicker(s.ticker) ? fmtKRW(s.cur * s.qty) : fmtUSD(s.cur * s.qty)}
                  change={<PriceChange value={s.buy ? ((s.cur - s.buy) / s.buy) * 100 : 0} size="sm" />}
                  onClick={() => {
                    const idx = stocks.findIndex((x) => x.ticker === s.ticker && x.name === s.name);
                    if (idx >= 0) setEditingIdx(idx);
                  }}
                />
              ))
            )}
          </div>
        </Card>
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4">
            <div className="font-display text-[var(--text-lg)] font-semibold tracking-[var(--tracking-heading)] text-[var(--text-primary)]">
              {t("portfolio.allocation")}
            </div>
            <AllocationBar held={held} cashTotalUSD={cashTotalUSD} totalValueUSD={totalValueUSD} t={t} />
          </Card>
          <Card className="flex flex-col gap-4">
            <div className="font-display text-[var(--text-lg)] font-semibold tracking-[var(--tracking-heading)] text-[var(--text-primary)]">
              {t("portfolio.nextStep")}
            </div>
            <div className="text-[var(--text-sm)] leading-[var(--leading-normal)] text-[var(--text-secondary)]">
              {t("portfolio.nextStep.body")}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="primary" onClick={() => handleStartCashEdit("krw")}>
                {t("portfolio.hero.manageCash")}
              </Button>
              <Badge tone="accent" size="sm">{t("portfolio.hero.streak")}</Badge>
            </div>
          </Card>
        </div>
      </div>

      {/* Cash management (KRW / USD editing — kept for parity) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CashTile
          label={t("portfolio.cashKrw")}
          value={userData.cash_krw || 0}
          fmt={fmtKRW}
          editing={cashEditing === "krw"}
          draft={cashDraft}
          onDraftChange={setCashDraft}
          onEditStart={() => handleStartCashEdit("krw")}
          onSave={handleSaveCash}
          onCancel={() => setCashEditing(null)}
        />
        <CashTile
          label={t("portfolio.cashUsd")}
          value={userData.cash_usd || 0}
          fmt={fmtUSD}
          editing={cashEditing === "usd"}
          draft={cashDraft}
          onDraftChange={setCashDraft}
          onEditStart={() => handleStartCashEdit("usd")}
          onSave={handleSaveCash}
          onCancel={() => setCashEditing(null)}
        />
      </div>

      <FlowBar />
      <CompetitorBriefCard />
      <TechSignalScanner />

      {/* Add-stock lives in a modal — single entry point via "Add an investment" */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t("portfolio.addStock.title")}
        subtitle={t("portfolio.addStock.subtitle")}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>
              {t("portfolio.cash.cancel")}
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddStock} disabled={addPending}>
              {addPending ? t("portfolio.addStock.submitting") : t("portfolio.addStock.submit")}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1.5 block text-[var(--text-sm)] font-medium text-[var(--text-secondary)]">
              {t("portfolio.addStock.namePlaceholder")}
            </label>
            <TickerSearchInput
              placeholder={t("portfolio.addStock.namePlaceholder")}
              value={addForm.name}
              onChange={(name) => setAddForm({ ...addForm, name })}
              onPick={handlePickTicker}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[var(--text-sm)] font-medium text-[var(--text-secondary)]">
                {t("portfolio.addStock.tickerPlaceholder")}
              </label>
              <Input
                placeholder={t("portfolio.addStock.tickerPlaceholder")}
                value={addForm.ticker}
                onChange={(e) => setAddForm({ ...addForm, ticker: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[var(--text-sm)] font-medium text-[var(--text-secondary)]">
                {t("portfolio.addStock.buyPlaceholder")} ({addBuyCurrency})
              </label>
              <Input
                type="number"
                placeholder={t("portfolio.addStock.buyPlaceholder")}
                value={addForm.buy}
                onChange={(e) => setAddForm({ ...addForm, buy: e.target.value })}
                className="w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[var(--text-sm)] font-medium text-[var(--text-secondary)]">
                {t("portfolio.addStock.qtyPlaceholder")}
              </label>
              <Input
                type="number"
                placeholder={t("portfolio.addStock.qtyPlaceholder")}
                value={addForm.qty}
                onChange={(e) => setAddForm({ ...addForm, qty: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[var(--text-sm)] font-medium text-[var(--text-secondary)]">
                {t("portfolio.addStock.curPlaceholder")}
              </label>
              <Input
                type="number"
                placeholder={t("portfolio.addStock.curPlaceholder")}
                value={addForm.cur}
                onChange={(e) => setAddForm({ ...addForm, cur: e.target.value })}
                className="w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[var(--text-sm)] font-medium text-[var(--text-secondary)]">
                {t("portfolio.addStock.marketAuto")}
              </label>
              <Select
                value={addForm.marketOverride}
                onChange={(e) => setAddForm({ ...addForm, marketOverride: e.target.value as "auto" | "kr" | "us" })}
                className="w-full"
              >
                <option value="auto">{t("portfolio.addStock.marketAuto")}</option>
                <option value="kr">{t("portfolio.filter.kr")}</option>
                <option value="us">{t("portfolio.filter.us")}</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[var(--text-sm)] font-medium text-[var(--text-secondary)]">
                {t("portfolio.table.status")}
              </label>
              <Select
                value={addForm.status}
                onChange={(e) => setAddForm({ ...addForm, status: e.target.value as StockStatus })}
                className="w-full"
              >
                {Object.entries(STATUS_LABEL_KEY).map(([v, key]) => (
                  <option key={v} value={v}>
                    {t(key)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {addError && <p className="text-[var(--text-md)] text-[var(--negative)]">{addError}</p>}
        </div>
      </Modal>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {(["all", "hold", "buy", "watch", "hidden"] as StatusFilter[]).map((v) => (
              <button
                key={v}
                onClick={() => setStatusFilter(v)}
                className={`h-9 rounded-[var(--radius-pill)] border px-4 text-[var(--text-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                  statusFilter === v
                    ? "border-[var(--accent-soft-border)] bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                    : "border-[var(--border-default)] bg-[var(--surface-1)] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {v === "all" ? t("portfolio.filter.all") : v === "hidden" ? t("portfolio.filter.hidden") : t(STATUS_LABEL_KEY[v])}
              </button>
            ))}
            <span className="mx-1 w-px self-stretch bg-[var(--border-default)]" />
            {(["all", "kr", "us"] as MarketFilter[]).map((v) => (
              <button
                key={v}
                onClick={() => setMarketFilter(v)}
                className={`h-9 rounded-[var(--radius-pill)] border px-4 text-[var(--text-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                  marketFilter === v
                    ? "border-[var(--accent-soft-border)] bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                    : "border-[var(--border-default)] bg-[var(--surface-1)] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {v === "all" ? t("portfolio.filter.all") : v === "kr" ? t("portfolio.filter.kr") : t("portfolio.filter.us")}
              </button>
            ))}
            <span className="mx-1 w-px self-stretch bg-[var(--border-default)]" />
            {(["all", "short", "long", ""] as StyleFilter[]).map((v) => (
              <button
                key={v || "unset"}
                onClick={() => setStyleFilter(v)}
                className={`h-9 rounded-[var(--radius-pill)] border px-4 text-[var(--text-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                  styleFilter === v
                    ? "border-[var(--accent-soft-border)] bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                    : "border-[var(--border-default)] bg-[var(--surface-1)] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {v === "all" ? t("portfolio.filter.all") : t(STYLE_LABEL_KEY[v])}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={handleRefresh} disabled={quotesFetching}>
            {quotesFetching ? t("portfolio.refreshing") : t("portfolio.refresh")}
          </Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title={t("portfolio.empty.title")} description={t("portfolio.empty.description")} />
        ) : (
          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full border-collapse text-left text-[var(--text-table)]">
              <thead>
                <tr className="border-b border-[var(--border-default)] text-[var(--text-xs)] text-[var(--text-muted)]">
                  <th className="py-3 pr-2 font-medium tracking-[var(--tracking-caps)] uppercase whitespace-nowrap">{t("portfolio.table.name")}</th>
                  <th className="py-3 pr-2 font-medium tracking-[var(--tracking-caps)] uppercase whitespace-nowrap">{t("portfolio.table.ticker")}</th>
                  <th className="py-3 pr-2 font-medium tracking-[var(--tracking-caps)] uppercase whitespace-nowrap text-right tabular-nums">{t("portfolio.table.buy")}</th>
                  <th className="py-3 pr-2 font-medium tracking-[var(--tracking-caps)] uppercase whitespace-nowrap text-right tabular-nums">{t("portfolio.table.current")}</th>
                  <th
                    className="py-3 pr-2 cursor-pointer select-none font-medium tracking-[var(--tracking-caps)] uppercase whitespace-nowrap text-right tabular-nums"
                    onClick={() => handleSort("qty")}
                  >
                    {t("portfolio.table.qty")} {sortIndicator("qty")}
                  </th>
                  <th
                    className="py-3 pr-2 cursor-pointer select-none font-medium tracking-[var(--tracking-caps)] uppercase whitespace-nowrap text-right tabular-nums"
                    onClick={() => handleSort("value")}
                  >
                    {t("portfolio.table.value")} {sortIndicator("value")}
                  </th>
                  <th
                    className="py-3 pr-2 cursor-pointer select-none font-medium tracking-[var(--tracking-caps)] uppercase whitespace-nowrap text-right tabular-nums"
                    onClick={() => handleSort("return")}
                  >
                    {t("portfolio.table.return")} {sortIndicator("return")}
                  </th>
                  <th
                    className="py-3 pr-2 cursor-pointer select-none font-medium tracking-[var(--tracking-caps)] uppercase whitespace-nowrap text-right tabular-nums"
                    onClick={() => handleSort("weight")}
                  >
                    {t("portfolio.table.weight")} {sortIndicator("weight")}
                  </th>
                  <th className="py-3 pr-2 font-medium tracking-[var(--tracking-caps)] uppercase whitespace-nowrap">{t("portfolio.table.status")}</th>
                  <th className="py-3 pr-2 font-medium tracking-[var(--tracking-caps)] uppercase whitespace-nowrap">{t("portfolio.table.style")}</th>
                  <th className="py-3 pr-2 font-medium tracking-[var(--tracking-caps)] uppercase whitespace-nowrap">{t("portfolio.table.account")}</th>
                  <th className="py-3 pr-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ s, i }) =>
                  editingIdx === i ? (
                    <EditRow key={i} stock={s} onSave={(patch) => handleSaveEdit(i, patch)} onCancel={() => setEditingIdx(null)} />
                  ) : (
                    <StockRow
                      key={i}
                      stock={s}
                      fxRate={fxRate}
                      totalValueUSD={totalValueUSD}
                      onEdit={() => setEditingIdx(i)}
                      onRemove={() => handleRemove(i)}
                      onToggleHidden={() => handleToggleHidden(i, !s.hidden)}
                    />
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <PortfolioNewsSection />
    </div>
  );
}

/** Allocation split by market (KR equity / US equity / Cash) — matches the mockup's bar + legend. */
function AllocationBar({
  held,
  cashTotalUSD,
  totalValueUSD,
  t,
}: {
  held: Stock[];
  cashTotalUSD: number;
  totalValueUSD: number;
  t: (k: string, params?: Record<string, string | number>) => string;
}) {
  let kr = 0;
  let us = 0;
  for (const s of held) {
    const v = isKrTicker(s.ticker) ? (s.cur * s.qty) / 1400 : s.cur * s.qty;
    if (isKrTicker(s.ticker)) kr += v;
    else us += v;
  }
  const total = totalValueUSD + cashTotalUSD || 1;
  const pct = (v: number) => (v / total) * 100;
  const krPct = pct(kr);
  const usPct = pct(us);
  const cashPct = pct(cashTotalUSD);
  const rows = [
    { label: t("portfolio.alloc.kr"), pct: krPct, color: "var(--chart-line)" },
    { label: t("portfolio.alloc.us"), pct: usPct, color: "var(--chart-alt-1)" },
    { label: t("portfolio.alloc.cash"), pct: cashPct, color: "var(--chart-alt-3)" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-[var(--radius-pill)]">
        {rows.map((r) => (
          <span key={r.label} style={{ width: Math.max(r.pct, 0.5) + "%", background: r.color }} />
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2.5 text-[var(--text-sm)]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: r.color }} />
            <span className="flex-1 text-[var(--text-secondary)]">{r.label}</span>
            <span className="font-mono text-[var(--text-primary)]">{r.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CashTile({
  label,
  value,
  fmt,
  editing,
  draft,
  onDraftChange,
  onEditStart,
  onSave,
  onCancel,
}: {
  label: string;
  value: number;
  fmt: (n: number) => string;
  editing: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  onEditStart: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  return (
    <Card className="flex flex-col gap-1.5 px-5 py-4">
      <div className="flex items-center justify-between gap-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
        <span className="truncate">{label}</span>
        {!editing && (
          <button
            onClick={onEditStart}
            className="shrink-0 text-[var(--text-xs)] text-[var(--text-secondary)] underline"
          >
            {t("portfolio.cash.edit")}
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex flex-wrap items-center gap-1">
          <input
            type="number"
            autoFocus
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[var(--border-focus)] bg-[var(--surface-2)] px-2 py-1.5 text-right font-mono text-[var(--text-base)] text-[var(--text-primary)] focus:outline-none"
          />
          <button
            onClick={onSave}
            className="shrink-0 rounded-[var(--radius-md)] bg-[var(--positive)] px-2.5 py-1.5 text-[var(--text-sm)] font-semibold text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)]"
          >
            {t("portfolio.cash.save")}
          </button>
          <button
            onClick={onCancel}
            className="shrink-0 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[var(--text-sm)] text-[var(--text-secondary)]"
          >
            {t("portfolio.cash.cancel")}
          </button>
        </div>
      ) : (
        <div className="truncate font-mono text-[var(--text-2xl)] font-semibold tracking-[var(--tracking-mono-big)] text-[var(--text-primary)]">
          {fmt(value)}
        </div>
      )}
    </Card>
  );
}

function StockRow({
  stock: s,
  fxRate,
  totalValueUSD,
  onEdit,
  onRemove,
  onToggleHidden,
}: {
  stock: Stock;
  fxRate: number;
  totalValueUSD: number;
  onEdit: () => void;
  onRemove: () => void;
  onToggleHidden: () => void;
}) {
  const t = useT();
  const isKR = isKrTicker(s.ticker);
  const v = s.cur * s.qty;
  const vUSD = isKR ? v / fxRate : v;
  const r = s.buy ? ((s.cur - s.buy) / s.buy) * 100 : 0;
  const w = totalValueUSD ? (vUSD / totalValueUSD) * 100 : 0;
  const ac = acctColor(s.account);
  const statusClass =
    s.status === "buy"
      ? "bg-[var(--color-success-bg)] text-[var(--color-success)]"
      : s.status === "hold"
        ? "bg-[var(--color-warning-bg)] text-[var(--color-warning)]"
        : "bg-[var(--color-info-bg)] text-[var(--color-info)]";
  const styleClass =
    s.style === "short"
      ? "bg-[var(--color-trade-short-bg)] text-[var(--color-trade-short-text)]"
      : s.style === "long"
        ? "bg-[var(--color-trade-long-bg)] text-[var(--color-trade-long-text)]"
        : "bg-[var(--color-bg-badge)] text-[var(--color-text-placeholder)]";

  return (
    <tr className="border-b border-[var(--color-border-faint)]">
      <td className="py-2 pr-2 whitespace-nowrap font-semibold text-[var(--color-text-primary)]">
        <span
          className={`mr-1 rounded px-1.5 py-0.5 text-[var(--text-2xs)] font-bold ${
            isKR ? "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]" : "bg-[var(--color-info-bg)] text-[var(--color-info)]"
          }`}
        >
          {isKR ? t("portfolio.market.kr") : t("portfolio.market.us")}
        </span>
        {s.name}
      </td>
      <td className="py-2 pr-2 whitespace-nowrap font-mono text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{s.ticker}</td>
      <td className="py-2 pr-2 text-right tabular-nums">{fmtPrice(s.buy, isKR)}</td>
      <td className="py-2 pr-2 text-right tabular-nums font-semibold">
        {fmtPrice(s.cur, isKR)}
        {s.marketState && (
          <span className="ml-1 text-[var(--text-2xs)] text-[var(--color-text-disabled)]">
            {t(MARKET_STATE_KEY[s.marketState] || "market.state.close")}
          </span>
        )}
      </td>
      <td className="py-2 pr-2 text-right tabular-nums">{s.qty}</td>
      <td className="py-2 pr-2 text-right tabular-nums">{isKR ? fmtKRW(v) : fmtUSD(v)}</td>
      <td className={`py-2 pr-2 text-right tabular-nums font-semibold ${r >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>
        {(r >= 0 ? "+" : "") + r.toFixed(2)}%
      </td>
      <td className="py-2 pr-2 text-right tabular-nums">{s.status === "hold" ? w.toFixed(1) + "%" : "—"}</td>
      <td className="py-2 pr-2">
        <span className={`rounded-[var(--radius-pill)] px-2 py-0.5 text-[var(--text-sm)] font-bold ${statusClass}`}>
          {t(STATUS_LABEL_KEY[s.status])}
        </span>
      </td>
      <td className="py-2 pr-2">
        <span className={`rounded-[var(--radius-pill)] px-2 py-0.5 text-[var(--text-sm)] font-bold ${styleClass}`}>
          {t(STYLE_ABBR_KEY[s.style || ""])}
        </span>
      </td>
      <td className="py-2 pr-2">
        <span className="rounded px-1.5 py-0.5 text-[var(--text-sm)] font-bold" style={{ background: ac.bg, color: ac.c }}>
          {s.account === "기타" ? t("portfolio.account.other").slice(0, 2) : (s.account || "기타").slice(0, 2)}
        </span>
      </td>
      <td className="whitespace-nowrap py-2 pr-2">
        <button
          onClick={onEdit}
          className="mr-1 rounded-[var(--radius-control)] border border-[var(--color-border-input)] px-2 py-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]"
        >
          {t("portfolio.action.edit")}
        </button>
        <button
          onClick={onRemove}
          className="mr-1 rounded-[var(--radius-control)] border border-[var(--color-error-border)] px-2 py-1 text-[var(--text-sm)] text-[var(--color-error)]"
        >
          {t("portfolio.action.remove")}
        </button>
        <button
          onClick={onToggleHidden}
          className="rounded-[var(--radius-control)] border px-2 py-1 text-[var(--text-sm)]"
          style={{
            borderColor: s.hidden ? "var(--color-accent-border)" : "var(--color-border-subtle)",
            background: s.hidden ? "var(--color-accent-bg)" : "var(--color-bg-surface)",
            color: s.hidden ? "var(--color-accent)" : "var(--color-text-placeholder)",
          }}
        >
          {s.hidden ? t("portfolio.action.restore") : t("portfolio.action.hide")}
        </button>
      </td>
    </tr>
  );
}

function EditRow({
  stock: s,
  onSave,
  onCancel,
}: {
  stock: Stock;
  onSave: (patch: Partial<Stock>) => void;
  onCancel: () => void;
}) {
  const [buy, setBuy] = useState(String(s.buy));
  const [qty, setQty] = useState(String(s.qty));
  const [status, setStatus] = useState<StockStatus>(s.status);
  const [style, setStyle] = useState<StockStyle>(s.style || "");
  const [account, setAccount] = useState(s.account || "기타");
  const [hidden, setHidden] = useState(!!s.hidden);
  const t = useT();

  function handleSave() {
    const patch: Partial<Stock> = { status, style, account, hidden };
    const b = parseFloat(buy);
    const q = parseFloat(qty);
    if (!isNaN(b) && b > 0) patch.buy = b;
    if (!isNaN(q) && q > 0) patch.qty = q;
    onSave(patch);
  }

  return (
    <tr className="border-b border-[var(--color-border-faint)] bg-[var(--color-edit-highlight)]">
      <td className="py-2 pr-2 font-semibold">{s.name}</td>
      <td className="py-2 pr-2 font-mono text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{s.ticker}</td>
      <td className="py-2 pr-2 text-right tabular-nums">
        <input
          type="number"
          value={buy}
          onChange={(e) => setBuy(e.target.value)}
          className="w-24 rounded-[var(--radius-control)] border border-[var(--color-warning)] px-1.5 py-1 text-right text-[var(--text-base)] tabular-nums"
        />
      </td>
      <td className="py-2 pr-2 text-right tabular-nums font-semibold">{Number(s.cur).toLocaleString()}</td>
      <td className="py-2 pr-2 text-right tabular-nums">
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-20 rounded-[var(--radius-control)] border border-[var(--color-warning)] px-1.5 py-1 text-right text-[var(--text-base)] tabular-nums"
        />
      </td>
      <td colSpan={3} />
      <td className="py-2 pr-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value as StockStatus)}>
          {Object.entries(STATUS_LABEL_KEY).map(([v, key]) => (
            <option key={v} value={v}>
              {t(key)}
            </option>
          ))}
        </Select>
      </td>
      <td className="py-2 pr-2">
        <Select value={style} onChange={(e) => setStyle(e.target.value as StockStyle)}>
          {Object.entries(STYLE_LABEL_KEY).map(([v, key]) => (
            <option key={v} value={v}>
              {t(key)}
            </option>
          ))}
        </Select>
      </td>
      <td className="py-2 pr-2">
        <Select value={account} onChange={(e) => setAccount(e.target.value)}>
          {ACCOUNT_LIST.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
      </td>
      <td className="whitespace-nowrap py-2 pr-2">
        <button
          onClick={() => setHidden(!hidden)}
          className="mr-1 rounded-[var(--radius-control)] border px-2 py-1 text-[var(--text-sm)]"
          style={{
            borderColor: hidden ? "var(--color-accent-border)" : "var(--color-border-subtle)",
            background: hidden ? "var(--color-accent-bg)" : "var(--color-bg-surface)",
            color: hidden ? "var(--color-accent)" : "var(--color-text-placeholder)",
          }}
        >
          {hidden ? t("portfolio.action.hiddenOn") : t("portfolio.action.hiddenOff")}
        </button>
        <button
          onClick={handleSave}
          className="mr-1 rounded-[var(--radius-control)] bg-[var(--color-success)] px-2 py-1 text-[var(--text-base)] text-white"
        >
          ✓
        </button>
        <button
          onClick={onCancel}
          className="rounded-[var(--radius-control)] border border-[var(--color-border-input)] px-2 py-1 text-[var(--text-base)] text-[var(--color-text-subtle)]"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
