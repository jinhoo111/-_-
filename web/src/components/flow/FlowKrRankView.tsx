"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useFlowKrRank } from "@/lib/queries/useFlow";
import { useUserData, useUpdateUserData } from "@/lib/queries/useUserData";
import type { FlowKrRow } from "@/lib/flow/constants";
import { FLOW_WARN_DAYS } from "@/lib/flow/constants";
import type { FlowAlertMemoSource, MemoArchiveEntry } from "@/lib/types/userData";

function fmtQty(n: number): string {
  const sign = n > 0 ? "+" : "";
  return sign + Math.round(n).toLocaleString();
}

function RankTable({ rows, kind }: { rows: FlowKrRow[]; kind: "organ" | "foreign" }) {
  const t = useT();
  if (!rows.length) return <EmptyState title={t("flow.empty")} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[var(--text-table)]">
        <thead>
          <tr className="border-b border-[var(--color-border-default)] text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            <th className="py-2 pr-2">{t("flow.krRank.table.name")}</th>
            <th className="py-2 pr-2">{t("flow.krRank.table.close")}</th>
            <th className="py-2 pr-2">{t("flow.krRank.table.change")}</th>
            <th className="py-2 pr-2">{t(kind === "organ" ? "flow.krRank.table.organ" : "flow.krRank.table.foreign")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const streak = kind === "organ" ? r.organStreak : r.foreignStreak;
            const val = kind === "organ" ? r.organ : r.foreign;
            return (
              <tr key={r.code} className="border-b border-[var(--color-border-faint)]">
                <td className="py-2 pr-2 font-semibold text-[var(--color-text-primary)]">{r.name}</td>
                <td className="py-2 pr-2">{r.close.toLocaleString()}</td>
                <td className={`py-2 pr-2 font-semibold ${r.changeRate >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>
                  {(r.changeRate >= 0 ? "+" : "") + r.changeRate.toFixed(2)}%
                </td>
                <td className={`py-2 pr-2 font-mono ${val >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>
                  {fmtQty(val)}
                  {Math.abs(streak) >= FLOW_WARN_DAYS && (
                    <span className="ml-1 text-[var(--text-2xs)] text-[var(--color-error-text)]">({Math.abs(streak)}일)</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function FlowKrRankView() {
  const t = useT();
  const { data, isLoading, isFetching, refetch, error } = useFlowKrRank();
  const { data: userData } = useUserData();
  const updateUserData = useUpdateUserData();
  const [warnResult, setWarnResult] = useState<"done" | "none" | null>(null);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }
  if (error || !data) {
    return <EmptyState title={t("flow.error")} />;
  }

  const rank = data;

  function handleWarnToJournal() {
    if (!userData) return;
    const today = new Date().toISOString().slice(0, 10);
    const memoArchive = userData.memo_archive;
    const streaked = [...rank.organBuy, ...rank.organSell].filter(
      (r) => Math.abs(r.organStreak) >= FLOW_WARN_DAYS
    );
    const already = new Set(
      memoArchive
        .filter((e) => e.source?.type === "flow" && e.time.slice(0, 10) === today)
        .map((e) => (e.source as FlowAlertMemoSource).code)
    );
    const fresh = streaked.filter((r) => !already.has(r.code));
    if (!fresh.length) {
      setWarnResult("none");
      return;
    }
    const now = new Date();
    const iso = now.toISOString();
    const newEntries: MemoArchiveEntry[] = fresh.map((r) => ({
      id: crypto.randomUUID(),
      text: `${r.name} 기관 순매수 ${r.organStreak}일 연속`,
      tag: "flow",
      time: iso,
      completedAt: iso,
      source: { type: "flow", code: r.code, name: r.name, organStreak: r.organStreak },
    }));
    updateUserData({ memo_archive: [...newEntries, ...memoArchive] });
    setWarnResult("done");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
          {t("flow.krRank.universe", { count: data.universe, date: data.date })}
        </span>
        <div className="flex items-center gap-2">
          {warnResult && (
            <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
              {t(warnResult === "done" ? "flow.krRank.warnToJournalDone" : "flow.krRank.warnToJournalNone")}
            </span>
          )}
          <Button size="sm" onClick={handleWarnToJournal}>
            {t("flow.krRank.warnToJournal")}
          </Button>
          <Button size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? t("flow.refreshing") : t("flow.refresh")}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <div className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("flow.krRank.organBuy")}</div>
          <RankTable rows={data.organBuy} kind="organ" />
        </Card>
        <Card className="flex flex-col gap-3">
          <div className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("flow.krRank.organSell")}</div>
          <RankTable rows={data.organSell} kind="organ" />
        </Card>
        <Card className="flex flex-col gap-3">
          <div className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("flow.krRank.foreignBuy")}</div>
          <RankTable rows={data.foreignBuy} kind="foreign" />
        </Card>
        <Card className="flex flex-col gap-3">
          <div className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("flow.krRank.foreignSell")}</div>
          <RankTable rows={data.foreignSell} kind="foreign" />
        </Card>
      </div>
    </div>
  );
}
