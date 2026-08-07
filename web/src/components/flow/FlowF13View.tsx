"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useT } from "@/lib/i18n/LanguageProvider";
import { use13f, use13fList } from "@/lib/queries/useFlow";
import { f13Money } from "@/lib/flow/constants";
import type { F13Added, F13Changed, F13Exited, F13Response, F13TopHolding } from "@/lib/flow/constants";

function f13Px(v: number | undefined): string {
  return v ? `$${v.toFixed(2)}` : "";
}

function f13Span(data: F13Response): string {
  return data.prevPeriod ? `${data.prevPeriod} ~ ${data.period}` : data.period;
}

export function FlowF13View() {
  const t = useT();
  const list = use13fList();
  const [id, setId] = useState<string | null>(null);
  const active = id ?? list.data?.[0]?.id ?? null;
  const f13 = use13f(active);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--color-error-border)] bg-[var(--color-error-bg)] px-3 py-2.5 text-[var(--text-sm)] text-[var(--color-error-text)]">
        <span>⚠️</span>
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{t("flow.f13.disclaimerTitle")}</span>
          <span>{t("flow.f13.disclaimerBody")}</span>
        </div>
      </div>

      <Card className="flex flex-wrap gap-1">
        {(list.data ?? []).map((inst) => (
          <button
            key={inst.id}
            onClick={() => setId(inst.id)}
            className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-[var(--text-sm)] ${
              active === inst.id ? "bg-[var(--color-accent-primary)] text-white" : "bg-[var(--color-bg-badge)] text-[var(--color-text-secondary)]"
            }`}
          >
            {inst.name} ({inst.who})
          </button>
        ))}
      </Card>

      {f13.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : f13.error || !f13.data ? (
        <EmptyState title={t("flow.error")} />
      ) : (
        <>
          <Card className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("flow.f13.totalValue")}</span>
              <span className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">{f13Money(f13.data.totalValue)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("flow.f13.holdingsCount")}</span>
              <span className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">{f13.data.count}</span>
            </div>
            <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
              {t("flow.f13.filedAt", { date: f13.data.filedAt, period: f13.data.period })}
            </span>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("flow.f13.top")}</div>
            <TopTable rows={f13.data.top} />
          </Card>

          {!f13.data.prevFiledAt ? (
            <EmptyState title={t("flow.f13.noPrev")} />
          ) : (
            <>
              <Card className="flex flex-col gap-3">
                <div className="flex flex-col gap-0.5">
                  <div className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("flow.f13.added")}</div>
                  <div className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                    {t("flow.f13.sub.added", { span: f13Span(f13.data), period: f13.data.period })}
                  </div>
                </div>
                <AddedTable rows={f13.data.added} />
              </Card>
              <Card className="flex flex-col gap-3">
                <div className="flex flex-col gap-0.5">
                  <div className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("flow.f13.exited")}</div>
                  <div className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                    {t("flow.f13.sub.exited", { span: f13Span(f13.data), prevPeriod: f13.data.prevPeriod || "—" })}
                  </div>
                </div>
                <ExitedTable rows={f13.data.exited} />
              </Card>
              <Card className="flex flex-col gap-3">
                <div className="flex flex-col gap-0.5">
                  <div className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("flow.f13.changed")}</div>
                  <div className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                    {t("flow.f13.sub.changed", { span: f13Span(f13.data) })}
                  </div>
                </div>
                <ChangedTable rows={f13.data.changed} />
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}

function TopTable({ rows }: { rows: F13TopHolding[] }) {
  const t = useT();
  if (!rows.length) return <EmptyState title={t("flow.empty")} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[var(--text-table)]">
        <thead>
          <tr className="border-b border-[var(--border-default)] text-[var(--text-xs)] text-[var(--text-muted)]">
            <th className="py-3 pr-2 font-medium tracking-[var(--tracking-caps)] uppercase">{t("flow.f13.table.name")}</th>
            <th className="py-3 pr-2 text-right font-medium tracking-[var(--tracking-caps)] uppercase tabular-nums">{t("flow.f13.table.value")}</th>
            <th className="py-3 pr-2 text-right font-medium tracking-[var(--tracking-caps)] uppercase tabular-nums">{t("flow.f13.table.weight")}</th>
            <th className="py-3 pr-2 text-right font-medium tracking-[var(--tracking-caps)] uppercase tabular-nums">{t("flow.f13.table.shares")}</th>
            <th className="py-3 pr-2 text-right font-medium tracking-[var(--tracking-caps)] uppercase tabular-nums">{t("flow.f13.table.price")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.cusip} className="border-b border-[var(--border-default)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-2)]">
              <td className="py-3 pr-2 font-semibold text-[var(--text-primary)]">{r.name}</td>
              <td className="py-3 pr-2 text-right font-mono tabular-nums">{f13Money(r.value)}</td>
              <td className="py-3 pr-2 text-right font-mono tabular-nums">{r.weight}%</td>
              <td className="py-3 pr-2 text-right font-mono tabular-nums">{r.shares.toLocaleString()}</td>
              <td className="py-3 pr-2 text-right font-mono tabular-nums text-[var(--color-text-tertiary)]">{f13Px(r.endPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddedTable({ rows }: { rows: F13Added[] }) {
  const t = useT();
  if (!rows.length) return <EmptyState title={t("flow.empty")} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[var(--text-table)]">
        <thead>
          <tr className="border-b border-[var(--border-default)] text-[var(--text-xs)] text-[var(--text-muted)]">
            <th className="py-3 pr-2 font-medium tracking-[var(--tracking-caps)] uppercase">{t("flow.f13.table.name")}</th>
            <th className="py-3 pr-2 text-right font-medium tracking-[var(--tracking-caps)] uppercase tabular-nums">{t("flow.f13.table.value")}</th>
            <th className="py-3 pr-2 text-right font-medium tracking-[var(--tracking-caps)] uppercase tabular-nums">{t("flow.f13.table.shares")}</th>
            <th className="py-3 pr-2 text-right font-medium tracking-[var(--tracking-caps)] uppercase tabular-nums">{t("flow.f13.table.price")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.cusip} className="border-b border-[var(--border-default)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-2)]">
              <td className="py-3 pr-2 font-semibold text-[var(--color-up)]">{r.name}</td>
              <td className="py-3 pr-2 text-right font-mono tabular-nums">{f13Money(r.value)}</td>
              <td className="py-3 pr-2 text-right font-mono tabular-nums">{r.shares.toLocaleString()}</td>
              <td className="py-3 pr-2 text-right font-mono tabular-nums text-[var(--color-text-tertiary)]">{f13Px(r.endPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExitedTable({ rows }: { rows: F13Exited[] }) {
  const t = useT();
  if (!rows.length) return <EmptyState title={t("flow.empty")} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[var(--text-table)]">
        <thead>
          <tr className="border-b border-[var(--border-default)] text-[var(--text-xs)] text-[var(--text-muted)]">
            <th className="py-3 pr-2 font-medium tracking-[var(--tracking-caps)] uppercase">{t("flow.f13.table.name")}</th>
            <th className="py-3 pr-2 text-right font-medium tracking-[var(--tracking-caps)] uppercase tabular-nums">{t("flow.f13.table.value")}</th>
            <th className="py-3 pr-2 text-right font-medium tracking-[var(--tracking-caps)] uppercase tabular-nums">{t("flow.f13.table.shares")}</th>
            <th className="py-3 pr-2 text-right font-medium tracking-[var(--tracking-caps)] uppercase tabular-nums">{t("flow.f13.table.price")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.cusip} className="border-b border-[var(--border-default)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-2)]">
              <td className="py-3 pr-2 font-semibold text-[var(--color-down)]">{r.name}</td>
              <td className="py-3 pr-2 text-right font-mono tabular-nums">{f13Money(r.prevValue)}</td>
              <td className="py-3 pr-2 text-right font-mono tabular-nums">{r.prevShares.toLocaleString()}</td>
              <td className="py-3 pr-2 text-right font-mono tabular-nums text-[var(--color-text-tertiary)]">{f13Px(r.prevEndPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChangedTable({ rows }: { rows: F13Changed[] }) {
  const t = useT();
  if (!rows.length) return <EmptyState title={t("flow.empty")} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[var(--text-table)]">
        <thead>
          <tr className="border-b border-[var(--border-default)] text-[var(--text-xs)] text-[var(--text-muted)]">
            <th className="py-3 pr-2 font-medium tracking-[var(--tracking-caps)] uppercase">{t("flow.f13.table.name")}</th>
            <th className="py-3 pr-2 text-right font-medium tracking-[var(--tracking-caps)] uppercase tabular-nums">{t("flow.f13.table.value")}</th>
            <th className="py-3 pr-2 text-right font-medium tracking-[var(--tracking-caps)] uppercase tabular-nums">{t("flow.f13.table.shares")}</th>
            <th className="py-3 pr-2 text-right font-medium tracking-[var(--tracking-caps)] uppercase tabular-nums">{t("flow.f13.table.price")}</th>
            <th className="py-3 pr-2 text-right font-medium tracking-[var(--tracking-caps)] uppercase tabular-nums">{t("flow.f13.table.diff")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.cusip} className="border-b border-[var(--border-default)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-2)]">
              <td className="py-3 pr-2 font-semibold text-[var(--text-primary)]">{r.name}</td>
              <td className="py-3 pr-2 text-right font-mono tabular-nums">{f13Money(r.value)}</td>
              <td className="py-3 pr-2 text-right font-mono tabular-nums">{r.shares.toLocaleString()}</td>
              <td className="py-3 pr-2 text-right font-mono tabular-nums text-[var(--color-text-tertiary)]">{f13Px(r.endPrice)}</td>
              <td className={`py-3 pr-2 text-right font-mono tabular-nums font-semibold ${r.diff >= 0 ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}`}>
                {(r.diff >= 0 ? "+" : "") + r.pct}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
