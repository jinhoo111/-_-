"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LEDGER_CATS, ledgerCatLabelKey } from "@/lib/journal/constants";
import type { LedgerType } from "@/lib/types/userData";
import { useT } from "@/lib/i18n/LanguageProvider";

export function LedgerForm({
  type,
  onSave,
  onCancel,
}: {
  type: LedgerType;
  onSave: (data: { type: LedgerType; amount: number; cat: string; memo: string }) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const cats = LEDGER_CATS[type];
  const [cat, setCat] = useState(cats[0]);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");

  function handleSave() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError(t("journal.ledger.amountRequired"));
      return;
    }
    onSave({ type, amount: Math.round(amt), cat, memo: memo.trim() });
  }

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-[var(--color-accent-border-soft)] bg-[var(--color-accent-subtle)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="h-[var(--btn-h-md)] rounded-[var(--radius-control)] border border-[var(--color-border-input)] bg-[var(--color-bg-surface)] px-2 text-[var(--text-md)] text-[var(--color-text-primary)]"
        >
          {cats.map((c) => (
            <option key={c} value={c}>
              {t(ledgerCatLabelKey(c))}
            </option>
          ))}
        </select>
        <Input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("journal.ledger.amountPlaceholder")}
          className="w-32"
        />
        <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder={t("journal.ledger.memoPlaceholder")} className="min-w-32 flex-1" />
      </div>
      <div className="flex gap-1.5 self-end">
        <Button size="sm" onClick={onCancel}>
          {t("journal.compose.cancel")}
        </Button>
        <Button size="sm" variant="primary" onClick={handleSave}>
          {type === "income" ? t("journal.ledger.saveIncome") : t("journal.ledger.saveExpense")}
        </Button>
      </div>
      {error && <p className="text-[var(--text-sm)] text-[var(--color-error-text)]">{error}</p>}
    </div>
  );
}
