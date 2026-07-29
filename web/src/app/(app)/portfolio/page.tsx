"use client";

import { useMemo, useState } from "react";
import { useUserData, useUpdateUserData } from "@/lib/queries/useUserData";
import { useFxRate, useQuotes } from "@/lib/queries/useQuotes";
import { isKrTicker, type Stock, type StockStatus, type StockStyle } from "@/lib/types/userData";
import { ACCOUNT_LIST, STATUS_LABEL, STYLE_LABEL, acctColor, resolveTickerFromName } from "@/lib/portfolio/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

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
  const { data: userData, isLoading } = useUserData();
  const updateUserData = useUpdateUserData();
  const { data: fxRate = 1400 } = useFxRate();
  const toast = useToast();

  const [curMode, setCurMode] = useState<CurMode>("USD");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("all");
  const [styleFilter, setStyleFilter] = useState<StyleFilter>("all");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [addForm, setAddForm] = useState({ name: "", ticker: "", buy: "", qty: "1", status: "hold" as StockStatus });
  const [addError, setAddError] = useState("");
  const [addPending, setAddPending] = useState(false);

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
        return { ...s, cur: q.price, marketState: q.stateLabel };
      });
      patchStocks(next);
    }
  }

  async function handleAddStock() {
    setAddError("");
    const name = addForm.name.trim();
    const buy = parseFloat(addForm.buy);
    if (!name || isNaN(buy)) {
      setAddError("종목명과 매수가를 입력해주세요.");
      return;
    }
    const qty = parseInt(addForm.qty) || 1;
    let ticker = addForm.ticker.trim().toUpperCase() || resolveTickerFromName(name) || name.toUpperCase();
    if (/^\d{6}$/.test(ticker)) ticker += ".KS";
    const market = isKrTicker(ticker) ? "kr" : "us";

    setAddPending(true);
    const newStock: Stock = { name, ticker, buy, cur: 0, qty, status: addForm.status, market, account: "기타", style: "" };

    try {
      const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(ticker)}`);
      const data = await res.json();
      const q = data?.[ticker];
      if (q) {
        newStock.cur = q.price;
        newStock.marketState = q.stateLabel;
      }
    } catch {
      // fall through — cur stays 0, user can edit manually
    }
    setAddPending(false);

    if (newStock.cur === 0) {
      setAddError(`가격 조회 실패: ${ticker} — 티커를 확인하세요 (예: AAPL, NVDA, 005930.KS)`);
    }
    patchStocks([...stocks, newStock]);
    setAddForm({ name: "", ticker: "", buy: "", qty: "1", status: "hold" });
    toast.show(`${name} 추가됨`, "success");
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

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            <span>총 평가금액</span>
            <span className="flex overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border-input)]">
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
          <div className="text-[var(--text-2xl)] font-semibold text-[var(--color-text-primary)]">
            {grandTotalUSD ? fmtTop(grandTotalUSD) : "—"}
          </div>
        </Card>
        <Card className="flex flex-col gap-1">
          <div className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">총 손익</div>
          <div className={`text-[var(--text-2xl)] font-semibold ${profitUSD >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>
            {totalValueUSD ? (profitUSD >= 0 ? "+" : "-") + fmtTop(Math.abs(profitUSD)) : "—"}
          </div>
        </Card>
        <Card className="flex flex-col gap-1">
          <div className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">수익률</div>
          <div className={`text-[var(--text-2xl)] font-semibold ${profitRate >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>
            {totalValueUSD ? (profitRate >= 0 ? "+" : "") + profitRate.toFixed(2) + "%" : "—"}
          </div>
        </Card>
        <Card className="flex flex-col gap-1">
          <div className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">보유 종목</div>
          <div className="text-[var(--text-2xl)] font-semibold text-[var(--color-text-primary)]">
            {held.length ? held.length + "개" : "—"}
          </div>
        </Card>
      </div>

      <Card className="flex flex-col gap-3">
        <div className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">종목 추가</div>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="종목명 (예: 삼성전자, NVDA)"
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            className="w-40"
          />
          <Input
            placeholder="티커 (선택)"
            value={addForm.ticker}
            onChange={(e) => setAddForm({ ...addForm, ticker: e.target.value })}
            className="w-32"
          />
          <Input
            type="number"
            placeholder="매수가"
            value={addForm.buy}
            onChange={(e) => setAddForm({ ...addForm, buy: e.target.value })}
            className="w-24"
          />
          <Input
            type="number"
            placeholder="수량"
            value={addForm.qty}
            onChange={(e) => setAddForm({ ...addForm, qty: e.target.value })}
            className="w-20"
          />
          <select
            value={addForm.status}
            onChange={(e) => setAddForm({ ...addForm, status: e.target.value as StockStatus })}
            className="h-[var(--btn-h-md)] rounded-[var(--radius-control)] border border-[var(--color-border-input)] bg-[var(--color-bg-surface)] px-2 text-[var(--text-lg)] text-[var(--color-text-primary)]"
          >
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <Button variant="primary" onClick={handleAddStock} disabled={addPending}>
            {addPending ? "조회 중..." : "추가"}
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
                {v === "all" ? "전체" : v === "hidden" ? "숨김" : STATUS_LABEL[v]}
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
                {v === "all" ? "전체" : v === "kr" ? "국내" : "미국"}
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
                {v === "all" ? "전체" : STYLE_LABEL[v]}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={handleRefresh} disabled={quotesFetching}>
            {quotesFetching ? "갱신 중..." : "시세 갱신"}
          </Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="종목이 없어요" description="위에서 종목을 추가해보세요." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[var(--text-table)]">
              <thead>
                <tr className="border-b border-[var(--color-border-default)] text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                  <th className="py-2 pr-2">종목</th>
                  <th className="py-2 pr-2">티커</th>
                  <th className="py-2 pr-2">매수가</th>
                  <th className="py-2 pr-2">현재가</th>
                  <th className="py-2 pr-2">수량</th>
                  <th className="py-2 pr-2">평가금액</th>
                  <th className="py-2 pr-2">수익률</th>
                  <th className="py-2 pr-2">비중</th>
                  <th className="py-2 pr-2">상태</th>
                  <th className="py-2 pr-2">스타일</th>
                  <th className="py-2 pr-2">계좌</th>
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
      <td className="py-2 pr-2 font-semibold text-[var(--color-text-primary)]">
        <span
          className={`mr-1 rounded px-1.5 py-0.5 text-[var(--text-2xs)] font-bold ${
            isKR ? "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]" : "bg-[var(--color-info-bg)] text-[var(--color-info)]"
          }`}
        >
          {isKR ? "국" : "미"}
        </span>
        {s.name}
      </td>
      <td className="py-2 pr-2 font-mono text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{s.ticker}</td>
      <td className="py-2 pr-2">{fmtPrice(s.buy, isKR)}</td>
      <td className="py-2 pr-2 font-semibold">
        {fmtPrice(s.cur, isKR)}
        {s.marketState && <span className="ml-1 text-[var(--text-2xs)] text-[var(--color-text-disabled)]">{s.marketState}</span>}
      </td>
      <td className="py-2 pr-2">{s.qty}</td>
      <td className="py-2 pr-2">{isKR ? fmtKRW(v) : fmtUSD(v)}</td>
      <td className={`py-2 pr-2 font-semibold ${r >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>
        {(r >= 0 ? "+" : "") + r.toFixed(2)}%
      </td>
      <td className="py-2 pr-2">{s.status === "hold" ? w.toFixed(1) + "%" : "—"}</td>
      <td className="py-2 pr-2">
        <span className={`rounded-[var(--radius-pill)] px-2 py-0.5 text-[var(--text-sm)] font-bold ${statusClass}`}>
          {STATUS_LABEL[s.status]}
        </span>
      </td>
      <td className="py-2 pr-2">
        <span className={`rounded-[var(--radius-pill)] px-2 py-0.5 text-[var(--text-sm)] font-bold ${styleClass}`}>
          {s.style === "short" ? "단" : s.style === "long" ? "장" : "미"}
        </span>
      </td>
      <td className="py-2 pr-2">
        <span className="rounded px-1.5 py-0.5 text-[var(--text-sm)] font-bold" style={{ background: ac.bg, color: ac.c }}>
          {(s.account || "기타").slice(0, 2)}
        </span>
      </td>
      <td className="whitespace-nowrap py-2 pr-2">
        <button
          onClick={onEdit}
          className="mr-1 rounded-[var(--radius-control)] border border-[var(--color-border-input)] px-2 py-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]"
        >
          편집
        </button>
        <button
          onClick={onRemove}
          className="mr-1 rounded-[var(--radius-control)] border border-[var(--color-error-border)] px-2 py-1 text-[var(--text-sm)] text-[var(--color-error)]"
        >
          삭제
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
          {s.hidden ? "복원" : "숨김"}
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
      <td className="py-2 pr-2">
        <input
          type="number"
          value={buy}
          onChange={(e) => setBuy(e.target.value)}
          className="w-20 rounded-[var(--radius-control)] border border-[var(--color-warning)] px-1.5 py-1 text-[var(--text-base)]"
        />
      </td>
      <td className="py-2 pr-2 font-semibold">{Number(s.cur).toLocaleString()}</td>
      <td className="py-2 pr-2">
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-16 rounded-[var(--radius-control)] border border-[var(--color-warning)] px-1.5 py-1 text-[var(--text-base)]"
        />
      </td>
      <td colSpan={3} />
      <td className="py-2 pr-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StockStatus)}
          className="rounded-[var(--radius-control)] border border-[var(--color-border-input)] px-1.5 py-1 text-[var(--text-sm)]"
        >
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2 pr-2">
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as StockStyle)}
          className="rounded-[var(--radius-control)] border border-[var(--color-border-input)] px-1.5 py-1 text-[var(--text-sm)]"
        >
          {Object.entries(STYLE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2 pr-2">
        <select
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          className="rounded-[var(--radius-control)] border border-[var(--color-border-input)] px-1.5 py-1 text-[var(--text-sm)]"
        >
          {ACCOUNT_LIST.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
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
          {hidden ? "숨김 ON" : "숨김 OFF"}
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
