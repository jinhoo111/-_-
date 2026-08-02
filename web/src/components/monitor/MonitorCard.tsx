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
  classifyEle,
  classifyMajor,
  computeHoldingChanges,
  dartFloat,
  discType,
  ownCounts,
  ownYmd,
  secFilingTitleParts,
  signOf,
  signalCategory,
  type DiscType,
  type Disclosure,
  type OwnershipRow,
} from "@/lib/monitor/constants";
import type { MonitorCompany } from "@/lib/types/userData";

const DISC_TYPES: DiscType[] = ["A", "B", "C", "D"];

const OWN_CAP = 12; // per-group display cap (officer filings can be numerous)

function fmtOwnDate(dt: string): string {
  const s = ownYmd(dt);
  return s.length === 8 ? `${s.slice(4, 6)}/${s.slice(6, 8)}` : "";
}

// Collapsible "🧬 지분변동 (5%룰·임원)" section — two sub-lists (5%-rule major holders vs
// officers), each row tagged new/increase/decrease/exit/flat, mirroring legacy's
// _ownershipSectionHTML / _renderOwnershipBody.
function OwnershipSection({
  major,
  ele,
  counts,
}: {
  major: OwnershipRow[];
  ele: OwnershipRow[];
  counts: { cNew: number; cInc: number; cDec: number };
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  const hasAny = major.length > 0 || ele.length > 0;

  return (
    <div className="rounded-[var(--radius-control)] border border-[var(--color-border-faint)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-[var(--text-sm)] font-medium text-[var(--color-text-secondary)]"
      >
        <span>
          {t("monitor.own.section.title")}{" "}
          <span className="text-[var(--text-xs)] font-normal text-[var(--color-text-tertiary)]">{t("monitor.own.section.sub")}</span>
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          {counts.cNew > 0 || counts.cInc > 0 || counts.cDec > 0 ? (
            <>
              {counts.cNew > 0 && (
                <span className="rounded-[var(--radius-pill)] bg-[var(--color-info-bg)] px-2 py-0.5 text-[var(--text-xs)] font-semibold text-[var(--color-info)]">
                  🆕 {t("monitor.own.new")} {counts.cNew}
                </span>
              )}
              {counts.cInc > 0 && (
                <span className="rounded-[var(--radius-pill)] bg-[var(--color-success-bg)] px-2 py-0.5 text-[var(--text-xs)] font-semibold text-[var(--color-success-text)]">
                  ▲ {t("monitor.own.inc")} {counts.cInc}
                </span>
              )}
              {counts.cDec > 0 && (
                <span className="rounded-[var(--radius-pill)] bg-[var(--color-error-bg)] px-2 py-0.5 text-[var(--text-xs)] font-semibold text-[var(--color-error-text)]">
                  ▼ {t("monitor.own.dec")} {counts.cDec}
                </span>
              )}
            </>
          ) : (
            <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{t("monitor.own.none")}</span>
          )}
          <span>{open ? "▾" : "▸"}</span>
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--color-border-faint)] px-2.5 py-2">
          {!hasAny ? (
            <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("monitor.own.empty")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              <OwnershipGroup title={t("monitor.own.majorTitle")} count={major.length} emptyLabel={t("monitor.own.majorEmpty")}>
                {major.slice(0, OWN_CAP).map((r) => {
                  const k = classifyMajor(r);
                  const rate = Math.abs(dartFloat(r.stkrt));
                  const irds = signOf(r.stkrt_irds) * Math.abs(dartFloat(r.stkrt_irds));
                  let detail: string;
                  if (k === "new") detail = `${t("monitor.own.tag.new")} ${rate.toFixed(2)}%`;
                  else if (k === "exit") detail = `${(rate - irds).toFixed(2)} → ${rate.toFixed(2)}% (5%↓)`;
                  else if (k === "flat") detail = `${rate.toFixed(2)}%`;
                  else detail = `${(rate - irds).toFixed(2)} → ${rate.toFixed(2)}% (${irds >= 0 ? "▲" : "▼"}${Math.abs(irds).toFixed(2)}%p)`;
                  return (
                    <OwnershipRowView
                      key={r.rcept_no}
                      date={fmtOwnDate(r.rcept_dt)}
                      tagKey={`monitor.own.tag.${k}`}
                      kind={k}
                      who={r.repror || "-"}
                      detail={detail}
                      rceptNo={r.rcept_no}
                    />
                  );
                })}
              </OwnershipGroup>

              <OwnershipGroup title={t("monitor.own.eleTitle")} count={ele.length} emptyLabel={t("monitor.own.eleEmpty")}>
                {ele.slice(0, OWN_CAP).map((r) => {
                  const k = classifyEle(r);
                  const d = signOf(r.sp_stock_lmp_irds_cnt) * Math.abs(dartFloat(r.sp_stock_lmp_irds_cnt));
                  const tagKey = k === "inc" ? "monitor.own.tag.buy" : k === "dec" ? "monitor.own.tag.sell" : "monitor.own.tag.change";
                  const detail = d ? `${d > 0 ? "▲" : "▼"}${Math.abs(d).toLocaleString()}주` : "-";
                  return (
                    <OwnershipRowView
                      key={r.rcept_no}
                      date={fmtOwnDate(r.rcept_dt)}
                      tagKey={tagKey}
                      kind={k}
                      who={r.repror || "-"}
                      detail={detail}
                      rceptNo={r.rcept_no}
                    />
                  );
                })}
              </OwnershipGroup>

              <p className="text-[var(--text-2xs)] text-[var(--color-text-tertiary)]">(연간 보고서 비교 추정)</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OwnershipGroup({
  title,
  count,
  emptyLabel,
  children,
}: {
  title: string;
  count: number;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 text-[var(--text-sm)] font-semibold text-[var(--color-text-secondary)]">
        {title} <span className="text-[var(--text-xs)] font-normal text-[var(--color-text-tertiary)]">{count}</span>
      </div>
      {count > 0 ? (
        <ul className="flex flex-col gap-1">{children}</ul>
      ) : (
        <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{emptyLabel}</p>
      )}
    </div>
  );
}

const OWN_TAG_COLOR: Record<string, string> = {
  new: "var(--color-info)",
  inc: "var(--color-success-text)",
  buy: "var(--color-success-text)",
  dec: "var(--color-error-text)",
  sell: "var(--color-error-text)",
  exit: "var(--color-error-text)",
  flat: "var(--color-text-tertiary)",
  change: "var(--color-text-tertiary)",
};

function OwnershipRowView({
  date,
  tagKey,
  kind,
  who,
  detail,
  rceptNo,
}: {
  date: string;
  tagKey: string;
  kind: string;
  who: string;
  detail: string;
  rceptNo: string;
}) {
  const t = useT();
  return (
    <li className="flex items-center gap-2 text-[var(--text-sm)]">
      <span className="w-10 flex-shrink-0 text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{date}</span>
      <span
        className="flex-shrink-0 rounded px-1.5 py-0.5 text-[var(--text-2xs)] font-bold"
        style={{ color: OWN_TAG_COLOR[kind] ?? "var(--color-text-tertiary)", background: "var(--color-bg-overlay)" }}
      >
        {t(tagKey)}
      </span>
      <span className="min-w-0 flex-1 truncate text-[var(--color-text-primary)]">{who}</span>
      <span className="flex-shrink-0 font-mono text-[var(--text-xs)] text-[var(--color-text-secondary)]">{detail}</span>
      <a
        href={`https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${rceptNo}`}
        target="_blank"
        rel="noreferrer"
        className="flex-shrink-0 text-[var(--text-xs)] text-[var(--color-text-tertiary)]"
      >
        ↗
      </a>
    </li>
  );
}

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

      <OwnershipSection major={data.major} ele={data.ele} counts={counts} />

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
