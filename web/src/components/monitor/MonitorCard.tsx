"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useMonitorCompany, useMonitorUs, useMonitorBrief } from "@/lib/queries/useMonitor";
import { useIsPro } from "@/lib/monitor/useIsPro";
import { ProLockCard } from "@/components/monitor/ProLockCard";
import { MonitorMemoForm } from "@/components/monitor/MonitorMemoForm";
import { MonitorMemoList } from "@/components/monitor/MonitorMemoList";
import {
  DISC_TYPE_LABEL_KEY,
  SEC_FORM_KEY,
  SEC_ITEM_KEY,
  SIGNAL_CATS,
  computeHoldingChanges,
  discType,
  ownCounts,
  secFilingTitleParts,
  signalCategory,
  type DiscType,
  type Disclosure,
} from "@/lib/monitor/constants";
import type { MonitorCompany } from "@/lib/types/userData";

const DISC_TYPES: DiscType[] = ["A", "B", "C", "D"];

function KrCardBody({ company }: { company: MonitorCompany }) {
  const t = useT();
  const { data, isLoading, error } = useMonitorCompany(company.corp_code);
  const [filter, setFilter] = useState<DiscType | "all">("all");
  const [showHoldings, setShowHoldings] = useState(false);
  const [briefFor, setBriefFor] = useState<Disclosure | null>(null);
  const isPro = useIsPro();
  const brief = useMonitorBrief();

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (error || !data) return <p className="text-[var(--text-sm)] text-[var(--color-error)]">{t("monitor.card.loadError")}</p>;

  const filtered = filter === "all" ? data.disclosures : data.disclosures.filter((d) => discType(d) === filter);
  const counts = ownCounts(data.major, data.ele);
  const changes = computeHoldingChanges(data.holdings, []);

  function handleBrief(d: Disclosure) {
    const sig = signalCategory(d);
    setBriefFor(d);
    brief.mutate({ corp_name: company.corp_name, stock_code: company.stock_code, report_nm: d.report_nm, category: sig?.category ?? "governance" });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-[var(--text-sm)] ${filter === "all" ? "bg-[var(--color-accent-primary)] text-[var(--color-accent-on)]" : "bg-[var(--color-bg-overlay)] text-[var(--color-text-secondary)]"}`}
        >
          {t("monitor.disc.all")}
        </button>
        {DISC_TYPES.map((dt) => (
          <button
            key={dt}
            onClick={() => setFilter(dt)}
            className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-[var(--text-sm)] ${filter === dt ? "bg-[var(--color-accent-primary)] text-[var(--color-accent-on)]" : "bg-[var(--color-bg-overlay)] text-[var(--color-text-secondary)]"}`}
          >
            {t(DISC_TYPE_LABEL_KEY[dt])}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-1.5">
        {filtered.slice(0, 5).map((d) => {
          const sig = signalCategory(d);
          return (
            <li key={d.rcept_no} className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] bg-[var(--color-bg-overlay)] px-2.5 py-1.5">
              <a
                href={`https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${d.rcept_no}`}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate text-[var(--text-md)] text-[var(--color-text-primary)] hover:underline"
              >
                {d.report_nm}
              </a>
              {sig && (
                <span className="flex items-center gap-1 text-[var(--text-xs)] font-semibold" style={{ color: SIGNAL_CATS[sig.category].color }}>
                  <span>{sig.weight === "high" ? "🔴" : sig.weight === "mid" ? "🟠" : "🟡"}</span>
                  {t(SIGNAL_CATS[sig.category].labelKey)}
                </span>
              )}
              <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{d.rcept_dt}</span>
              {isPro ? (
                <Button size="sm" variant="default" onClick={() => handleBrief(d)}>
                  <span className="mr-1 rounded-[var(--radius-pill)] bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-indigo)] px-1.5 py-0.5 text-[var(--text-2xs)] font-bold text-white">
                    Pro✨
                  </span>
                  {t("monitor.brief.button")}
                </Button>
              ) : null}
            </li>
          );
        })}
        {!filtered.length && <li className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("monitor.disc.empty")}</li>}
      </ul>

      {briefFor && (
        <div className="rounded-[var(--radius-control)] border border-[var(--color-border-default)] p-2.5 text-[var(--text-sm)]">
          {brief.isPending && t("monitor.brief.loading")}
          {brief.isError && <span className="text-[var(--color-error)]">{t("monitor.brief.error")}</span>}
          {brief.isSuccess && brief.data.text}
        </div>
      )}
      {!isPro && <ProLockCard label={t("monitor.brief.locked")} />}

      <div className="flex gap-1.5 text-[var(--text-sm)]">
        <span className="rounded-[var(--radius-pill)] bg-[var(--color-info-bg)] px-2 py-0.5 font-semibold text-[var(--color-info)]">
          🆕 {t("monitor.own.new")} {counts.cNew}
        </span>
        <span className="rounded-[var(--radius-pill)] bg-[var(--color-success-bg)] px-2 py-0.5 font-semibold text-[var(--color-success-text)]">
          ▲ {t("monitor.own.inc")} {counts.cInc}
        </span>
        <span className="rounded-[var(--radius-pill)] bg-[var(--color-error-bg)] px-2 py-0.5 font-semibold text-[var(--color-error-text)]">
          ▼ {t("monitor.own.dec")} {counts.cDec}
        </span>
      </div>

      <button onClick={() => setShowHoldings((v) => !v)} className="text-left text-[var(--text-sm)] font-medium text-[var(--color-text-secondary)]">
        {showHoldings ? "▾" : "▸"} {t("monitor.holdings.title")} ({data.holdingsYear})
      </button>
      {showHoldings && (
        <ul className="flex flex-col gap-1 text-[var(--text-sm)]">
          {data.holdings.map((h) => (
            <li key={h.inv_prm} className="flex justify-between">
              <span>{h.inv_prm}</span>
              <span className="font-mono">{h.trmend_blce_qy}</span>
            </li>
          ))}
          {!data.holdings.length && <li className="text-[var(--color-text-tertiary)]">{t("monitor.holdings.empty")}</li>}
          {changes.length > 0 && (
            <>
              <li className="mt-1 font-medium text-[var(--color-text-tertiary)]">{t("monitor.holdings.changes")}</li>
              {changes.map((c) => (
                <li key={c.name} className="flex justify-between">
                  <span>{c.name}</span>
                  <span>{t(`monitor.holdings.change.${c.type}`)} {c.detail}</span>
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
}

function UsCardBody({ company }: { company: MonitorCompany }) {
  const t = useT();
  const { data, isLoading, error } = useMonitorUs(company.stock_code, company.cik ?? "");

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (error || !data) return <p className="text-[var(--text-sm)] text-[var(--color-error)]">{t("monitor.card.loadError")}</p>;

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1.5">
        {data.filings.slice(0, 8).map((f) => {
          const parts = secFilingTitleParts(f);
          return (
            <li key={f.url} className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] bg-[var(--color-bg-overlay)] px-2.5 py-1.5">
              <a href={f.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-[var(--text-md)] text-[var(--color-text-primary)] hover:underline">
                {t(SEC_FORM_KEY[f.form] ?? "")} {f.form}
                {parts.kind === "items" && " · " + parts.codes.map((c) => t(SEC_ITEM_KEY[c] ?? c)).join(", ")}
                {parts.kind === "raw" && " · " + parts.text}
              </a>
              <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{f.filedAt.slice(0, 10)}</span>
            </li>
          );
        })}
        {!data.filings.length && <li className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("monitor.disc.empty")}</li>}
      </ul>
    </div>
  );
}

export function MonitorCard({
  company,
  onDelete,
  onToggleAlert,
  onSaveMemo,
  onDeleteMemo,
}: {
  company: MonitorCompany;
  onDelete: () => void;
  onToggleAlert: () => void;
  onSaveMemo: (text: string, source: { disclosure_title: string; disclosure_date: string } | null) => void;
  onDeleteMemo: (id: number) => void;
}) {
  const t = useT();
  const isUs = company.market === "US";

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">{company.corp_name}</span>
          <span className="ml-2 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{company.market}{company.stock_code ? ` · ${company.stock_code}` : ""}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onToggleAlert} title={t("monitor.card.alertToggle")} className={company.alert ? "text-[var(--color-warning)]" : "text-[var(--color-text-tertiary)]"}>
            🔔
          </button>
          <button onClick={onDelete} className="text-[var(--text-sm)] text-[var(--color-error)]">
            {t("monitor.card.delete")}
          </button>
        </div>
      </div>

      {isUs ? <UsCardBody company={company} /> : <KrCardBody company={company} />}

      <div className="border-t border-[var(--color-border-faint)] pt-2.5">
        <MonitorMemoForm onSave={onSaveMemo} />
        <div className="mt-2">
          <MonitorMemoList memos={company.memos} onDelete={onDeleteMemo} />
        </div>
      </div>
    </Card>
  );
}
