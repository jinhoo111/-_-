"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useInsiderLatest, useInsiderStock } from "@/lib/queries/useFlow";
import { useUserData } from "@/lib/queries/useUserData";
import type { InsiderTx } from "@/lib/flow/constants";

type InsiderDirection = "all" | "S" | "P";
type InsiderSort = "amount" | "date_desc" | "date_asc";

function InsiderTable({ rows }: { rows: InsiderTx[] }) {
  const t = useT();
  if (!rows.length) return <EmptyState title={t("flow.empty")} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[var(--text-table)]">
        <thead>
          <tr className="border-b border-[var(--color-border-default)] text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            <th className="py-2 pr-2">{t("flow.insider.table.company")}</th>
            <th className="py-2 pr-2">{t("flow.insider.table.owner")}</th>
            <th className="py-2 pr-2">{t("flow.insider.table.role")}</th>
            <th className="py-2 pr-2">{t("flow.insider.table.type")}</th>
            <th className="py-2 pr-2 text-right tabular-nums">{t("flow.insider.table.shares")}</th>
            <th className="py-2 pr-2 text-right tabular-nums">{t("flow.insider.table.price")}</th>
            <th className="py-2 pr-2 text-right tabular-nums">{t("flow.insider.table.amount")}</th>
            <th className="py-2 pr-2 text-right tabular-nums">{t("flow.insider.table.sharesAfter")}</th>
            <th className="py-2 pr-2">{t("flow.insider.table.issuer")}</th>
            <th className="py-2 pr-2">{t("flow.insider.table.filedAt")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.symbol}-${r.date}-${i}`} className="border-b border-[var(--color-border-faint)]">
              <td className="py-2 pr-2 font-semibold text-[var(--color-text-primary)]">{r.symbol}</td>
              <td className="py-2 pr-2">
                {r.owner}
                {r.isTopExec && (
                  <span className="ml-1 rounded px-1 py-0.5 text-[var(--text-2xs)] font-bold bg-[var(--color-info-bg)] text-[var(--color-info)]">
                    {t("flow.insider.topExec")}
                  </span>
                )}
              </td>
              <td className="py-2 pr-2 text-[var(--color-text-tertiary)]">{r.role || "—"}</td>
              <td className="py-2 pr-2">
                <span
                  className={`rounded-[var(--radius-pill)] px-2 py-0.5 text-[var(--text-xs)] font-bold ${
                    r.code === "P" ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)]" : "bg-[var(--color-error-bg)] text-[var(--color-error-text)]"
                  }`}
                >
                  {r.code === "P" ? "📈 " : "📉 "}
                  {r.code === "P" ? t("flow.insider.code.P") : t("flow.insider.code.S")}
                </span>
              </td>
              <td className="py-2 pr-2 text-right tabular-nums">{r.shares.toLocaleString()}</td>
              <td className="py-2 pr-2 text-right tabular-nums">${r.price.toFixed(2)}</td>
              <td className="py-2 pr-2 text-right tabular-nums font-mono">${r.amount.toLocaleString()}</td>
              <td className="py-2 pr-2 text-right tabular-nums">{r.sharesAfter.toLocaleString()}</td>
              <td className="py-2 pr-2 text-[var(--color-text-tertiary)]">{r.issuer || "—"}</td>
              <td className="py-2 pr-2 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{r.filedAt.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FlowInsiderView() {
  const t = useT();
  const [tickerInput, setTickerInput] = useState("");
  const [searchTicker, setSearchTicker] = useState<string | null>(null);
  const [direction, setDirection] = useState<InsiderDirection>("all");
  const [execOnly, setExecOnly] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);
  const [sort, setSort] = useState<InsiderSort>("amount");

  const { data: userData } = useUserData();
  const latest = useInsiderLatest(!searchTicker);
  const stock = useInsiderStock(searchTicker);

  const active = searchTicker ? stock : latest;

  const myTickers = useMemo(() => {
    if (!userData) return new Set<string>();
    return new Set(
      userData.stocks
        .filter((s) => s.market === "us")
        .map((s) => s.ticker.trim().toUpperCase())
    );
  }, [userData]);

  const rows = useMemo(() => {
    const source = active.data?.rows ?? [];
    let filtered = source.filter((r) => {
      if (direction !== "all" && r.code !== direction) return false;
      if (execOnly && !r.isTopExec) return false;
      if (mineOnly && !myTickers.has(r.symbol.toUpperCase())) return false;
      return true;
    });
    filtered = [...filtered];
    if (sort === "date_desc" || sort === "date_asc") {
      filtered.sort((a, b) => {
        const ad = a.date || a.filedAt || "";
        const bd = b.date || b.filedAt || "";
        if (!ad && !bd) return b.amount - a.amount;
        if (!ad) return 1;
        if (!bd) return -1;
        if (ad === bd) return b.amount - a.amount;
        return sort === "date_desc" ? (ad < bd ? 1 : -1) : ad < bd ? -1 : 1;
      });
    }
    return filtered;
  }, [active.data, direction, execOnly, mineOnly, myTickers, sort]);

  function handleSearch() {
    const v = tickerInput.trim().toUpperCase();
    setSearchTicker(v || null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] px-3 py-2.5 text-[var(--text-sm)] text-[var(--color-info)]">
        <span>ℹ️</span>
        <span>{t("flow.insider.disclaimer")}</span>
      </div>

      <Card className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={t("flow.insider.searchPlaceholder")}
          value={tickerInput}
          onChange={(e) => setTickerInput(e.target.value)}
          className="w-48"
        />
        <Button size="sm" onClick={handleSearch}>
          {t("flow.insider.search")}
        </Button>
        {searchTicker && (
          <Button size="sm" onClick={() => setSearchTicker(null)}>
            {t("flow.tab.insider")}
          </Button>
        )}
      </Card>

      <Card className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={direction === "all" ? "primary" : "default"} onClick={() => setDirection("all")}>
          {t("flow.insider.filter.all")}
        </Button>
        <Button size="sm" variant={direction === "S" ? "primary" : "default"} onClick={() => setDirection("S")}>
          📉 {t("flow.insider.filter.sell")}
        </Button>
        <Button size="sm" variant={direction === "P" ? "primary" : "default"} onClick={() => setDirection("P")}>
          📈 {t("flow.insider.filter.buy")}
        </Button>
        <span className="w-2" />
        <Button size="sm" variant={execOnly ? "primary" : "default"} onClick={() => setExecOnly((v) => !v)}>
          👔 {t("flow.insider.filter.execOnly")}
        </Button>
        {userData && (
          <Button size="sm" variant={mineOnly ? "primary" : "default"} onClick={() => setMineOnly((v) => !v)}>
            ⭐ {t("flow.insider.filter.mineOnly")}
          </Button>
        )}
      </Card>

      <Card className="flex flex-wrap items-center gap-2">
        <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{t("flow.insider.sort.label")}</span>
        <Button size="sm" variant={sort === "amount" ? "primary" : "default"} onClick={() => setSort("amount")}>
          💰 {t("flow.insider.sort.amount")}
        </Button>
        <Button size="sm" variant={sort === "date_desc" ? "primary" : "default"} onClick={() => setSort("date_desc")}>
          📅 {t("flow.insider.sort.dateDesc")}
        </Button>
        <Button size="sm" variant={sort === "date_asc" ? "primary" : "default"} onClick={() => setSort("date_asc")}>
          📅 {t("flow.insider.sort.dateAsc")}
        </Button>
      </Card>

      {active.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : active.error || !active.data ? (
        <EmptyState title={t("flow.error")} />
      ) : (
        <Card>
          <InsiderTable rows={rows} />
        </Card>
      )}
    </div>
  );
}
