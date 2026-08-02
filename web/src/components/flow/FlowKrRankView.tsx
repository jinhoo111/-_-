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

function MyHoldingsFlow({ rank, myCodes }: { rank: import("@/lib/flow/constants").FlowKrRank; myCodes: Map<string, string> }) {
  const t = useT();
  if (!myCodes.size) return null;
  const all = [...rank.organBuy, ...rank.organSell, ...rank.foreignBuy, ...rank.foreignSell];
  const seen = new Map<string, FlowKrRow>();
  for (const x of all) {
    if (myCodes.has(x.code) && !seen.has(x.code)) seen.set(x.code, x);
  }
  const mine = [...seen.values()];
  if (!mine.length) return null;
  const warn = mine.filter((x) => x.organStreak <= -FLOW_WARN_DAYS);

  return (
    <Card className="flex flex-col gap-3">
      <div className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("flow.mine.title")}</div>
      {warn.length > 0 && (
        <div className="flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--color-error-border)] bg-[var(--color-error-bg)] px-3 py-2.5 text-[var(--text-sm)] text-[var(--color-error-text)]">
          <span>⚠️</span>
          <span>
            {t("flow.mine.warnSellStreak", {
              names: warn.map((x) => x.name).join(", "),
            })}
          </span>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {mine.map((x) => (
          <div key={x.code} className="flex items-center justify-between gap-2 border-b border-[var(--color-border-faint)] py-1.5 last:border-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-[var(--color-text-primary)]">{x.name}</span>
              <span className="text-[var(--text-2xs)] text-[var(--color-text-tertiary)]">{x.code}</span>
            </div>
            <div className="flex items-center gap-3 text-[var(--text-sm)] tabular-nums">
              <span className={x.organ >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}>
                {t("flow.krRank.table.organ")} {fmtQty(x.organ)}
              </span>
              <span className={x.foreign >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}>
                {t("flow.krRank.table.foreign")} {fmtQty(x.foreign)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

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
            <th className="py-2 pr-2 text-right tabular-nums">{t("flow.krRank.table.close")}</th>
            <th className="py-2 pr-2 text-right tabular-nums">{t("flow.krRank.table.change")}</th>
            <th className="py-2 pr-2 text-right tabular-nums">{t(kind === "organ" ? "flow.krRank.table.organ" : "flow.krRank.table.foreign")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const streak = kind === "organ" ? r.organStreak : r.foreignStreak;
            const val = kind === "organ" ? r.organ : r.foreign;
            return (
              <tr key={r.code} className="border-b border-[var(--color-border-faint)]">
                <td className="py-2 pr-2 font-semibold text-[var(--color-text-primary)]">{r.name}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{r.close.toLocaleString()}</td>
                <td className={`py-2 pr-2 text-right tabular-nums font-semibold ${r.changeRate >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>
                  {(r.changeRate >= 0 ? "+" : "") + r.changeRate.toFixed(2)}%
                </td>
                <td className={`py-2 pr-2 text-right tabular-nums font-mono ${val >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>
                  {fmtQty(val)}
                  {streak <= -FLOW_WARN_DAYS && (
                    <span className="ml-1 inline-block rounded-[var(--radius-pill)] px-1.5 py-0.5 text-[var(--text-2xs)] font-bold bg-[var(--color-down)]/15 text-[var(--color-down)]">
                      {Math.abs(streak)}일
                    </span>
                  )}
                  {streak >= FLOW_WARN_DAYS && (
                    <span className="ml-1 inline-block rounded-[var(--radius-pill)] px-1.5 py-0.5 text-[var(--text-2xs)] font-bold bg-[var(--color-up)]/15 text-[var(--color-up)]">
                      {streak}일
                    </span>
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
  const sellStreaks = [...rank.organSell].filter((r) => Math.abs(r.organStreak) >= FLOW_WARN_DAYS);
  const myCodes = new Map<string, string>(
    (userData?.stocks ?? [])
      .filter((s) => s.market === "kr")
      .map((s) => {
        const code = s.ticker.replace(/\.(KS|KQ)$/i, "").trim();
        return [code, s.name] as [string, string];
      })
      .filter(([code]) => /^\d{6}$/.test(code))
  );

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
      {sellStreaks.length > 0 && (
        <div className="flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--color-error-border)] bg-[var(--color-error-bg)] px-3 py-2.5 text-[var(--text-sm)] text-[var(--color-error-text)]">
          <span>⚠️</span>
          <span>
            {sellStreaks
              .slice(0, 5)
              .map((r) => `${r.name} (${t("flow.krRank.streakSell", { n: Math.abs(r.organStreak) })})`)
              .join(", ")}
          </span>
        </div>
      )}
      <MyHoldingsFlow rank={rank} myCodes={myCodes} />
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
