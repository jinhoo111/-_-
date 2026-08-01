"use client";

import { useState } from "react";
import { useUserData, useUpdateUserData } from "@/lib/queries/useUserData";
import { useT } from "@/lib/i18n/LanguageProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { MonitorSearch } from "@/components/monitor/MonitorSearch";
import { MonitorViewTabs, type MonitorView } from "@/components/monitor/MonitorViewTabs";
import { MonitorCard } from "@/components/monitor/MonitorCard";
import { MonitorTable } from "@/components/monitor/MonitorTable";
import { MonitorRadar } from "@/components/monitor/MonitorRadar";
import { MonitorDemo } from "@/components/monitor/MonitorDemo";
import { MAX_COMPANIES } from "@/lib/monitor/constants";
import type { ResolvedCompany } from "@/lib/monitor/server";
import type { MonitorCompany, MonitorMemo } from "@/lib/types/userData";

export default function MonitorPage() {
  const t = useT();
  const { data: userData, isLoading } = useUserData();
  const updateUserData = useUpdateUserData();
  const [view, setView] = useState<MonitorView>("card");
  const [selectedCorpCode, setSelectedCorpCode] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  const companies = userData?.monitor_companies ?? [];
  const memoArchive = userData?.memo_archive ?? [];

  if (!companies.length && !userData) {
    return <MonitorDemo />;
  }

  function handleAdd(resolved: ResolvedCompany) {
    if (companies.some((c) => c.corp_code === resolved.corp_code)) return;
    const next: MonitorCompany = {
      corp_code: resolved.corp_code,
      corp_name: resolved.corp_name,
      stock_code: resolved.stock_code,
      market: resolved.market,
      alert: true,
      lastCheckedAt: null,
      addedAt: new Date().toISOString(),
      memos: [],
      cik: resolved.cik,
      exchange: resolved.exchange,
    };
    updateUserData({ monitor_companies: [...companies, next] });
  }

  function handleDelete(corpCode: string) {
    updateUserData({ monitor_companies: companies.filter((c) => c.corp_code !== corpCode) });
  }

  function handleToggleAlert(corpCode: string) {
    updateUserData({
      monitor_companies: companies.map((c) => (c.corp_code === corpCode ? { ...c, alert: !c.alert } : c)),
    });
  }

  function handleSaveMemo(corpCode: string, text: string, source: { disclosure_title: string; disclosure_date: string } | null) {
    const co = companies.find((c) => c.corp_code === corpCode);
    if (!co) return;
    const now = new Date();
    const iso = now.toISOString();
    const journalId = now.getTime();
    const memo: MonitorMemo = { id: journalId, text, time: iso, source, journalId };
    const nextCompanies = companies.map((c) => (c.corp_code === corpCode ? { ...c, memos: [memo, ...c.memos] } : c));

    const bridgeEntry = {
      id: crypto.randomUUID(),
      text: `[${co.corp_name}] ${text}`,
      tag: "monitor" as const,
      time: iso,
      completedAt: iso,
      source: {
        type: "monitor" as const,
        corp_code: co.corp_code,
        corp_name: co.corp_name,
        disclosure_title: source?.disclosure_title,
        disclosure_date: source?.disclosure_date,
      },
    };

    updateUserData({ monitor_companies: nextCompanies, memo_archive: [bridgeEntry, ...memoArchive] });
  }

  function handleDeleteMemo(corpCode: string, memoId: number) {
    updateUserData({
      monitor_companies: companies.map((c) => (c.corp_code === corpCode ? { ...c, memos: c.memos.filter((m) => m.id !== memoId) } : c)),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <MonitorSearch disabled={companies.length >= MAX_COMPANIES} onAdd={handleAdd} />

      {!companies.length ? (
        <EmptyState title={t("monitor.empty")} />
      ) : (
        <>
          <MonitorViewTabs view={view} onChange={setView} />

          {view === "card" && (
            <div className="flex flex-col gap-3">
              {companies.map((co) => (
                <MonitorCard
                  key={co.corp_code}
                  company={co}
                  onDelete={() => handleDelete(co.corp_code)}
                  onToggleAlert={() => handleToggleAlert(co.corp_code)}
                  onSaveMemo={(text, source) => handleSaveMemo(co.corp_code, text, source)}
                  onDeleteMemo={(id) => handleDeleteMemo(co.corp_code, id)}
                />
              ))}
            </div>
          )}

          {view === "table" && <MonitorTable companies={companies} onSelect={setSelectedCorpCode} />}

          {view === "radar" && <MonitorRadar companies={companies} />}

          {view === "table" && selectedCorpCode && (
            <MonitorCard
              company={companies.find((c) => c.corp_code === selectedCorpCode)!}
              onDelete={() => handleDelete(selectedCorpCode)}
              onToggleAlert={() => handleToggleAlert(selectedCorpCode)}
              onSaveMemo={(text, source) => handleSaveMemo(selectedCorpCode, text, source)}
              onDeleteMemo={(id) => handleDeleteMemo(selectedCorpCode, id)}
            />
          )}
        </>
      )}
    </div>
  );
}
