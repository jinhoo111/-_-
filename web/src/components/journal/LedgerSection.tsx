"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { LedgerForm } from "@/components/journal/LedgerForm";
import { fmtWon, ledgerCatLabelKey } from "@/lib/journal/constants";
import type { LedgerEntry, LedgerType } from "@/lib/types/userData";
import { useT } from "@/lib/i18n/LanguageProvider";

export function LedgerSection({
  entries,
  onSave,
  onDelete,
}: {
  entries: LedgerEntry[];
  onSave: (data: { type: LedgerType; amount: number; cat: string; memo: string }) => void;
  onDelete: (id: string) => void;
}) {
  const t = useT();
  const [composingType, setComposingType] = useState<LedgerType | null>(null);

  function toggle(type: LedgerType) {
    setComposingType((cur) => (cur === type ? null : type));
  }

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-default)] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)]">💰 {t("journal.ledger.section")}</span>
        <div className="flex gap-1.5">
          <Button size="sm" onClick={() => toggle("expense")} className="border-[var(--color-error-border)] text-[var(--color-error)]">
            {t("journal.ledger.addExpense")}
          </Button>
          <Button size="sm" onClick={() => toggle("income")} className="border-[var(--color-success)] text-[var(--color-success-text)]">
            {t("journal.ledger.addIncome")}
          </Button>
        </div>
      </div>

      {composingType && (
        <LedgerForm
          type={composingType}
          onSave={(data) => {
            onSave(data);
            setComposingType(null);
          }}
          onCancel={() => setComposingType(null)}
        />
      )}

      {entries.length === 0 ? (
        <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{t("journal.ledger.empty")}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {entries.map((e) => {
            const isIncome = e.type === "income";
            return (
              <div key={e.id} className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-default)] p-2">
                <span className="min-w-0 flex-1 text-[var(--text-md)] text-[var(--color-text-primary)]">
                  {isIncome ? "💰" : "💸"} <b>{t(ledgerCatLabelKey(e.cat))}</b>
                  {e.memo && <span className="text-[var(--color-text-tertiary)]"> {e.memo}</span>}
                </span>
                <span className={`whitespace-nowrap font-bold ${isIncome ? "text-[var(--color-success-text)]" : "text-[var(--color-error-text)]"}`}>
                  {isIncome ? "+" : "-"}
                  {fmtWon(e.amount)}
                </span>
                <button onClick={() => onDelete(e.id)} className="text-[var(--text-xs)] text-[var(--color-error)] hover:underline">
                  {t("journal.entry.delete")}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
