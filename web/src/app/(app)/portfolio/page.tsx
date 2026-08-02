"use client";

import { useMemo, useState } from "react";
import { useUserData, useUpdateUserData } from "@/lib/queries/useUserData";
import { useFxRate, useQuotes } from "@/lib/queries/useQuotes";
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
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/LanguageProvider";

const MARKET_STATE_KEY: Record<string, string> = {
  PRE: "market.state.pre",
  POST: "market.state.after",
  REGULAR: "market.state.delayed",
  CLOSED: "market.state.close",
};

type StatusFilter = "all" | "hidden" | StockStatus;
type MarketFilter = "all" | "kr" | "us";
type StyleFilter = "all" | StockStyle;
type CurMode = "USD" | "KRW";

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
  const { data: fxRate = 1400 } = useFxRate();
  const toast = useToast();

  const [curMode, setCurMode] = useState<CurMode>("USD");
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

  const fmtTop = (n: number) => (curMode === "KRW" ? fmtKRW(n * fxRate) : fmtUSD(n));

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            <span className="truncate">{t("portfolio.totalValue")}</span>
            <span className="flex shrink-0 overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border-input)]">
              <button
                onClick={() => setCurMode("USD")}
                className={`px-1.5 text-[var(--text-2xs)] ${curMode === "USD" ? "bg-[var(--color-accent-primary)] text-white" : ""}`}
              >
                $
              </button>
              <button
                onClick={() => setCurMode("KRW")}
                className={`px-1.5 text-[var(--text-2xs)] ${curMode === "KRW" ? "bg-[var(--color-accent-primary)] text-white" : ""}`}
              >
                ₩
              </button>
            </span>
          </div>
          <div className="truncate text-[var(--text-2xl)] font-semibold text-[var(--color-text-primary)]">
            {grandTotalUSD ? fmtTop(grandTotalUSD) : "—"}
          </div>
        </Card>
        <Card className="flex flex-col gap-1">
          <div className="truncate text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("portfolio.totalProfit")}</div>
          <div
            className={`truncate text-[var(--text-2xl)] font-semibold ${profitUSD >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}
          >
            {totalValueUSD ? (profitUSD >= 0 ? "+" : "-") + fmtTop(Math.abs(profitUSD)) : "—"}
          </div>
        </Card>
        <Card className="flex flex-col gap-1">
          <div className="truncate text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("portfolio.profitRate")}</div>
          <div
            className={`truncate text-[var(--text-2xl)] font-semibold ${profitRate >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}
          >
            {totalValueUSD ? (profitRate >= 0 ? "+" : "") + profitRate.toFixed(2) + "%" : "—"}
          </div>
        </Card>
        <Card className="flex flex-col gap-1">
          <div className="truncate text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("portfolio.heldCount")}</div>
          <div className="truncate text-[var(--text-2xl)] font-semibold text-[var(--color-text-primary)]">
            {held.length ? t("portfolio.count", { count: held.length }) : "—"}
          </div>
        </Card>
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

      <Card className="flex flex-col gap-3">
        <div className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("portfolio.addStock.title")}</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <TickerSearchInput
            placeholder={t("portfolio.addStock.namePlaceholder")}
            value={addForm.name}
            onChange={(name) => setAddForm({ ...addForm, name })}
            onPick={handlePickTicker}
            className="min-w-[140px] flex-1 basis-[180px]"
          />
          <Input
            placeholder={t("portfolio.addStock.tickerPlaceholder")}
            value={addForm.ticker}
            onChange={(e) => setAddForm({ ...addForm, ticker: e.target.value })}
            className="w-28 shrink-0"
          />
          <div className="relative w-24 shrink-0">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-lg)] text-[var(--color-text-placeholder)]">
              {addBuyCurrency}
            </span>
            <Input
              type="number"
              placeholder={t("portfolio.addStock.buyPlaceholder")}
              value={addForm.buy}
              onChange={(e) => setAddForm({ ...addForm, buy: e.target.value })}
              className="pl-6"
            />
          </div>
          <Input
            type="number"
            placeholder={t("portfolio.addStock.qtyPlaceholder")}
            value={addForm.qty}
            onChange={(e) => setAddForm({ ...addForm, qty: e.target.value })}
            className="w-20 shrink-0"
          />
          <Input
            type="number"
            placeholder={t("portfolio.addStock.curPlaceholder")}
            value={addForm.cur}
            onChange={(e) => setAddForm({ ...addForm, cur: e.target.value })}
            className="w-24 shrink-0"
          />
          <Select
            value={addForm.marketOverride}
            onChange={(e) => setAddForm({ ...addForm, marketOverride: e.target.value as "auto" | "kr" | "us" })}
            className="shrink-0"
          >
            <option value="auto">{t("portfolio.addStock.marketAuto")}</option>
            <option value="kr">{t("portfolio.filter.kr")}</option>
            <option value="us">{t("portfolio.filter.us")}</option>
          </Select>
          <Select
            value={addForm.status}
            onChange={(e) => setAddForm({ ...addForm, status: e.target.value as StockStatus })}
            className="shrink-0"
          >
            {Object.entries(STATUS_LABEL_KEY).map(([v, key]) => (
              <option key={v} value={v}>
                {t(key)}
              </option>
            ))}
          </Select>
          <Button variant="primary" onClick={handleAddStock} disabled={addPending} className="shrink-0">
            {addPending ? t("portfolio.addStock.submitting") : t("portfolio.addStock.submit")}
          </Button>
        </div>
        {addError && <p className="text-[var(--text-md)] text-[var(--color-error-text)]">{addError}</p>}
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {(["all", "hold", "buy", "watch", "hidden"] as StatusFilter[]).map((v) => (
              <button
                key={v}
                onClick={() => setStatusFilter(v)}
                className={`rounded-[var(--radius-pill)] px-3 py-1 text-[var(--text-sm)] ${
                  statusFilter === v
                    ? "bg-[var(--color-accent-primary)] text-white"
                    : "bg-[var(--color-bg-badge)] text-[var(--color-text-secondary)]"
                }`}
              >
                {v === "all" ? t("portfolio.filter.all") : v === "hidden" ? t("portfolio.filter.hidden") : t(STATUS_LABEL_KEY[v])}
              </button>
            ))}
            <span className="mx-1 w-px self-stretch bg-[var(--color-border-default)]" />
            {(["all", "kr", "us"] as MarketFilter[]).map((v) => (
              <button
                key={v}
                onClick={() => setMarketFilter(v)}
                className={`rounded-[var(--radius-pill)] px-3 py-1 text-[var(--text-sm)] ${
                  marketFilter === v
                    ? "bg-[var(--color-accent-primary)] text-white"
                    : "bg-[var(--color-bg-badge)] text-[var(--color-text-secondary)]"
                }`}
              >
                {v === "all" ? t("portfolio.filter.all") : v === "kr" ? t("portfolio.filter.kr") : t("portfolio.filter.us")}
              </button>
            ))}
            <span className="mx-1 w-px self-stretch bg-[var(--color-border-default)]" />
            {(["all", "short", "long", ""] as StyleFilter[]).map((v) => (
              <button
                key={v || "unset"}
                onClick={() => setStyleFilter(v)}
                className={`rounded-[var(--radius-pill)] px-3 py-1 text-[var(--text-sm)] ${
                  styleFilter === v
                    ? "bg-[var(--color-accent-primary)] text-white"
                    : "bg-[var(--color-bg-badge)] text-[var(--color-text-secondary)]"
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
                <tr className="border-b border-[var(--color-border-default)] text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                  <th className="py-2 pr-2 whitespace-nowrap">{t("portfolio.table.name")}</th>
                  <th className="py-2 pr-2 whitespace-nowrap">{t("portfolio.table.ticker")}</th>
                  <th className="py-2 pr-2 whitespace-nowrap text-right tabular-nums">{t("portfolio.table.buy")}</th>
                  <th className="py-2 pr-2 whitespace-nowrap text-right tabular-nums">{t("portfolio.table.current")}</th>
                  <th
                    className="py-2 pr-2 cursor-pointer select-none whitespace-nowrap text-right tabular-nums"
                    onClick={() => handleSort("qty")}
                  >
                    {t("portfolio.table.qty")} {sortIndicator("qty")}
                  </th>
                  <th
                    className="py-2 pr-2 cursor-pointer select-none whitespace-nowrap text-right tabular-nums"
                    onClick={() => handleSort("value")}
                  >
                    {t("portfolio.table.value")} {sortIndicator("value")}
                  </th>
                  <th
                    className="py-2 pr-2 cursor-pointer select-none whitespace-nowrap text-right tabular-nums"
                    onClick={() => handleSort("return")}
                  >
                    {t("portfolio.table.return")} {sortIndicator("return")}
                  </th>
                  <th
                    className="py-2 pr-2 cursor-pointer select-none whitespace-nowrap text-right tabular-nums"
                    onClick={() => handleSort("weight")}
                  >
                    {t("portfolio.table.weight")} {sortIndicator("weight")}
                  </th>
                  <th className="py-2 pr-2 whitespace-nowrap">{t("portfolio.table.status")}</th>
                  <th className="py-2 pr-2 whitespace-nowrap">{t("portfolio.table.style")}</th>
                  <th className="py-2 pr-2 whitespace-nowrap">{t("portfolio.table.account")}</th>
                  <th className="py-2 pr-2"></th>
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
    <Card className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
        <span className="truncate">{label}</span>
        {!editing && (
          <button
            onClick={onEditStart}
            className="shrink-0 text-[var(--text-2xs)] text-[var(--color-text-secondary)] underline"
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
            className="min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--color-warning)] px-1.5 py-1 text-right text-[var(--text-lg)] tabular-nums"
          />
          <button
            onClick={onSave}
            className="shrink-0 rounded-[var(--radius-control)] bg-[var(--color-success)] px-2 py-1 text-[var(--text-sm)] text-white"
          >
            {t("portfolio.cash.save")}
          </button>
          <button
            onClick={onCancel}
            className="shrink-0 rounded-[var(--radius-control)] border border-[var(--color-border-input)] px-2 py-1 text-[var(--text-sm)] text-[var(--color-text-subtle)]"
          >
            {t("portfolio.cash.cancel")}
          </button>
        </div>
      ) : (
        <div className="truncate text-[var(--text-2xl)] font-semibold text-[var(--color-text-primary)]">{fmt(value)}</div>
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
      ? "bg-[var(--color-success-dark)] text-white"
      : s.status === "hold"
        ? "bg-[var(--color-warning-dark)] text-white"
        : "bg-[var(--color-accent)] text-white";
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
