"use client";

import { useState } from "react";
import { useUserData, useUpdateUserData } from "@/lib/queries/useUserData";
import { useQuotes } from "@/lib/queries/useQuotes";
import { isKrTicker } from "@/lib/types/userData";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LanguageProvider";

// Ported from legacy `page-news` "실시간 시세" tab: a login-gated quote watchlist
// (user_data.quote_symbols), default NVDA/AAPL/TSLA/MSFT, with add/remove/refresh.
const MARKET_STATE_KEY: Record<string, string> = {
  PRE: "market.state.pre",
  POST: "market.state.after",
  REGULAR: "market.state.delayed",
  CLOSED: "market.state.close",
};

export function QuotesView() {
  const t = useT();
  const { data: userData } = useUserData();
  const updateUserData = useUpdateUserData();
  const [symbol, setSymbol] = useState("");
  const [error, setError] = useState("");

  const symbols = userData?.quote_symbols ?? [];
  const { data: quotes, isFetching, refetch } = useQuotes(symbols);

  function addSymbol() {
    const s = symbol.trim().toUpperCase();
    if (!s) {
      setError("");
      return;
    }
    if (symbols.includes(s)) {
      setError(t("news.quotes.duplicate"));
      return;
    }
    updateUserData({ quote_symbols: [...symbols, s] });
    setSymbol("");
    setError("");
  }

  function removeSymbol(s: string) {
    updateUserData({ quote_symbols: symbols.filter((x) => x !== s) });
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[var(--text-base)] font-bold text-[var(--color-text-primary)]">{t("news.quotes.title")}</span>
        <Button size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "⟳" : t("news.quotes.refresh")}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Input
          placeholder={t("news.quotes.addPlaceholder")}
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addSymbol();
          }}
          className="w-40 shrink-0"
        />
        <Button size="sm" onClick={addSymbol}>
          {t("news.quotes.add")}
        </Button>
      </div>
      {error && <p className="text-[var(--text-md)] text-[var(--color-error-text)]">{error}</p>}
      {symbols.length === 0 ? (
        <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("news.quotes.empty")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {symbols.map((s) => {
            const q = quotes?.[s];
            const isKR = isKrTicker(s);
            return (
              <div key={s} className="flex flex-col gap-1 rounded-[var(--radius-control)] bg-[var(--color-bg-overlay)] p-3">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[var(--text-sm)] font-bold text-[var(--color-text-primary)]">{s}</span>
                  <button
                    type="button"
                    onClick={() => removeSymbol(s)}
                    className="cursor-pointer text-[var(--text-2xs)] text-[var(--color-text-tertiary)] hover:underline"
                    aria-label={`${t("news.quotes.remove")} ${s}`}
                  >
                    ✕
                  </button>
                </div>
                {q ? (
                  <>
                    <span className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">
                      {isKR ? "₩" + Math.round(q.price).toLocaleString() : "$" + q.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[var(--text-sm)] ${(q.changePercent ?? 0) >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>
                      {q.changePercent != null ? `${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%` : ""} · {t(MARKET_STATE_KEY[q.state] ?? "market.state.close")}
                    </span>
                  </>
                ) : (
                  <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">…</span>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{t("news.quotes.note")}</p>
    </Card>
  );
}
