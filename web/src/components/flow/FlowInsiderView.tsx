"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useInsiderLatest, useInsiderStock } from "@/lib/queries/useFlow";
import type { InsiderTx } from "@/lib/flow/constants";

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
            <th className="py-2 pr-2">{t("flow.insider.table.shares")}</th>
            <th className="py-2 pr-2">{t("flow.insider.table.price")}</th>
            <th className="py-2 pr-2">{t("flow.insider.table.amount")}</th>
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
              <td className="py-2 pr-2">{r.shares.toLocaleString()}</td>
              <td className="py-2 pr-2">${r.price.toFixed(2)}</td>
              <td className="py-2 pr-2 font-mono">${r.amount.toLocaleString()}</td>
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

  const latest = useInsiderLatest(!searchTicker);
  const stock = useInsiderStock(searchTicker);

  const active = searchTicker ? stock : latest;

  function handleSearch() {
    const v = tickerInput.trim().toUpperCase();
    setSearchTicker(v || null);
  }

  return (
    <div className="flex flex-col gap-4">
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

      {active.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : active.error || !active.data ? (
        <EmptyState title={t("flow.error")} />
      ) : (
        <Card>
          <InsiderTable rows={active.data.rows} />
        </Card>
      )}
    </div>
  );
}
