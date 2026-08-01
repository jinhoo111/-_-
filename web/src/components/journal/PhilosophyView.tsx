"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { fmtImpulseDate, impulseSort } from "@/lib/journal/constants";
import type { ImpulseTradeEntry, PhilosophyEntry } from "@/lib/types/userData";
import { useLang, useT } from "@/lib/i18n/LanguageProvider";

function PhilosophyCard({
  entry,
  isFirst,
  isLast,
  onMove,
  onDelete,
}: {
  entry: PhilosophyEntry;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}) {
  const t = useT();
  return (
    <div className="flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-default)] p-2">
      <p className="flex-1 text-[var(--text-md)] whitespace-pre-wrap text-[var(--color-text-primary)]">{entry.text}</p>
      <div className="flex gap-1">
        <button
          onClick={() => onMove(-1)}
          disabled={isFirst}
          title={t("journal.philosophy.moveUp")}
          className="rounded-[5px] border border-[var(--color-border-input)] px-1.5 py-0.5 text-[var(--text-xs)] text-[var(--color-text-tertiary)] disabled:opacity-30"
        >
          ↑
        </button>
        <button
          onClick={() => onMove(1)}
          disabled={isLast}
          title={t("journal.philosophy.moveDown")}
          className="rounded-[5px] border border-[var(--color-border-input)] px-1.5 py-0.5 text-[var(--text-xs)] text-[var(--color-text-tertiary)] disabled:opacity-30"
        >
          ↓
        </button>
        <button
          onClick={onDelete}
          title={t("journal.philosophy.delete")}
          className="rounded-[5px] border border-[var(--color-error-border)] px-1.5 py-0.5 text-[var(--text-xs)] text-[var(--color-error)]"
        >
          {t("journal.philosophy.delete")}
        </button>
      </div>
    </div>
  );
}

export function PhilosophyView({
  philosophy,
  impulseTrades,
  impulseSortDir,
  onToggleImpulseSort,
  onMove,
  onDelete,
  onDeleteImpulseById,
}: {
  philosophy: PhilosophyEntry[];
  impulseTrades: ImpulseTradeEntry[];
  impulseSortDir: "asc" | "desc";
  onToggleImpulseSort: () => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDelete: (id: string) => void;
  onDeleteImpulseById: (id: string) => void;
}) {
  const t = useT();
  const { lang } = useLang();
  const mustItems = philosophy.filter((p) => p.type === "must");
  const neverItems = philosophy.filter((p) => p.type === "never");
  const impSorted = impulseSort(impulseTrades, impulseSortDir);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-2 rounded-[var(--radius-3xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 shadow-[var(--shadow-card)]">
        <h2 className="text-[var(--text-lg)] font-semibold text-[var(--color-success-text)]">
          {t("journal.philosophy.mustColumn", { count: mustItems.length })}
        </h2>
        {mustItems.length === 0 ? (
          <EmptyState title={t("journal.philosophy.empty")} description={t("journal.philosophy.emptyHint")} />
        ) : (
          <div className="flex flex-col gap-1.5">
            {mustItems.map((entry, i) => (
              <PhilosophyCard
                key={entry.id}
                entry={entry}
                isFirst={i === 0}
                isLast={i === mustItems.length - 1}
                onMove={(dir) => onMove(entry.id, dir)}
                onDelete={() => onDelete(entry.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-[var(--radius-3xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 shadow-[var(--shadow-card)]">
        <h2 className="text-[var(--text-lg)] font-semibold text-[var(--color-error-text)]">
          {t("journal.philosophy.neverColumn", { count: neverItems.length + impSorted.length })}
        </h2>

        {impSorted.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-sm)] font-semibold text-[var(--color-text-secondary)]">
                {t("journal.philosophy.impulseHeader", { count: impSorted.length })}
              </span>
              <button
                onClick={onToggleImpulseSort}
                className="rounded-[5px] border border-[var(--color-border-input)] px-1.5 py-0.5 text-[var(--text-xs)] text-[var(--color-text-tertiary)]"
              >
                {t(impulseSortDir === "desc" ? "journal.philosophy.impulseSortDesc" : "journal.philosophy.impulseSortAsc")}
              </button>
            </div>
            {impSorted.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-2 rounded-[var(--radius-control)] border p-2"
                style={{ borderColor: "var(--color-error-border)" }}
              >
                <div className="flex-1">
                  <span
                    className="mb-1 inline-block rounded-[var(--radius-pill)] px-2 py-0.5 text-[var(--text-xs)] font-semibold"
                    style={{ background: "var(--color-error-bg)", color: "var(--color-error-text)" }}
                  >
                    {t("journal.philosophy.impulseChip", { date: fmtImpulseDate(entry.date, lang) })}
                  </span>
                  <p className="whitespace-pre-wrap text-[var(--text-md)] text-[var(--color-text-primary)]">{entry.reason}</p>
                </div>
                <button
                  onClick={() => onDeleteImpulseById(entry.id)}
                  title={t("journal.philosophy.delete")}
                  className="rounded-[5px] border border-[var(--color-error-border)] px-1.5 py-0.5 text-[var(--text-xs)] text-[var(--color-error)]"
                >
                  {t("journal.philosophy.delete")}
                </button>
              </div>
            ))}
          </div>
        )}

        {impSorted.length > 0 && neverItems.length > 0 && <hr className="border-[var(--color-border-default)]" />}

        {neverItems.length === 0 && impSorted.length === 0 ? (
          <EmptyState title={t("journal.philosophy.empty")} description={t("journal.philosophy.emptyHint")} />
        ) : (
          <div className="flex flex-col gap-1.5">
            {neverItems.map((entry, i) => (
              <PhilosophyCard
                key={entry.id}
                entry={entry}
                isFirst={i === 0}
                isLast={i === neverItems.length - 1}
                onMove={(dir) => onMove(entry.id, dir)}
                onDelete={() => onDelete(entry.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
