"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useIsPro } from "@/lib/monitor/useIsPro";
import { useMonitorBrief } from "@/lib/queries/useMonitor";
import { ProLockCard } from "@/components/monitor/ProLockCard";
import { SIGNAL_CATS, type SignalCategory } from "@/lib/monitor/constants";
import type { MonitorCompany, MonitorSignal } from "@/lib/types/userData";

interface RadarRow {
  company: MonitorCompany;
  signal: MonitorSignal;
}

export function MonitorRadar({ companies }: { companies: MonitorCompany[] }) {
  const t = useT();
  const isPro = useIsPro();
  const brief = useMonitorBrief();
  const [filter, setFilter] = useState<SignalCategory | "all">("all");
  const [briefKey, setBriefKey] = useState<string | null>(null);

  const rows = useMemo(() => {
    const all: RadarRow[] = [];
    for (const co of companies) {
      for (const sig of co.signals ?? []) all.push({ company: co, signal: sig });
    }
    all.sort((a, b) => (b.signal.date || "").localeCompare(a.signal.date || ""));
    return filter === "all" ? all : all.filter((r) => r.signal.category === filter);
  }, [companies, filter]);

  if (!companies.some((co) => co.signals?.length)) {
    return <EmptyState title={t("monitor.radar.empty")} />;
  }

  function handleBrief(row: RadarRow) {
    const key = row.signal.rcept_no;
    setBriefKey(key);
    brief.mutate({ corp_name: row.company.corp_name, stock_code: row.company.stock_code, report_nm: row.signal.report_nm, category: row.signal.category as SignalCategory });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-[var(--text-sm)] ${filter === "all" ? "bg-[var(--color-accent-primary)] text-[var(--color-accent-on)]" : "bg-[var(--color-bg-overlay)] text-[var(--color-text-secondary)]"}`}
        >
          {t("monitor.disc.all")}
        </button>
        {(Object.keys(SIGNAL_CATS) as SignalCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-[var(--text-sm)] ${filter === cat ? "bg-[var(--color-accent-primary)] text-[var(--color-accent-on)]" : "bg-[var(--color-bg-overlay)] text-[var(--color-text-secondary)]"}`}
          >
            {t(SIGNAL_CATS[cat].labelKey)}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <li key={`${row.company.corp_code}-${row.signal.rcept_no}`} className="flex flex-col gap-1 rounded-[var(--radius-control)] bg-[var(--color-bg-overlay)] px-2.5 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-[var(--color-text-primary)]">{row.company.corp_name}</span>
                <span className="ml-2 text-[var(--text-sm)] text-[var(--color-text-secondary)]">{row.signal.report_nm}</span>
              </div>
              <span className="text-[var(--text-xs)] font-semibold" style={{ color: SIGNAL_CATS[row.signal.category as SignalCategory]?.color }}>
                {t(SIGNAL_CATS[row.signal.category as SignalCategory]?.labelKey ?? "")}
              </span>
              <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{row.signal.date}</span>
              {isPro && (
                <Button size="sm" onClick={() => handleBrief(row)}>
                  {t("monitor.brief.button")}
                </Button>
              )}
            </div>
            {briefKey === row.signal.rcept_no && (
              <div className="rounded-[var(--radius-control)] border border-[var(--color-border-default)] p-2 text-[var(--text-sm)]">
                {brief.isPending && t("monitor.brief.loading")}
                {brief.isError && <span className="text-[var(--color-error)]">{t("monitor.brief.error")}</span>}
                {brief.isSuccess && brief.data.text}
              </div>
            )}
          </li>
        ))}
      </ul>
      {!isPro && <ProLockCard label={t("monitor.brief.locked")} />}
    </div>
  );
}
