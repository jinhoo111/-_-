"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { roundKg, WEIGHT_GOAL_EPSILON } from "@/lib/journal/constants";
import type { WeightEntry } from "@/lib/types/userData";
import { useT } from "@/lib/i18n/LanguageProvider";

export function WeightSection({
  date,
  entries,
  goal,
  onSave,
  onDelete,
}: {
  date: string;
  entries: WeightEntry[];
  goal: number | null;
  onSave: (kg: number) => void;
  onDelete: () => void;
}) {
  const t = useT();

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const current = sorted.find((e) => e.date === date);
  const prev = [...sorted].reverse().find((e) => e.date < date);

  const [value, setValue] = useState(current ? String(current.kg) : prev ? String(prev.kg) : "");

  function step(delta: number) {
    const base = parseFloat(value) || 0;
    setValue(Math.max(0, roundKg(base + delta)).toFixed(1));
  }

  function handleSave() {
    const v = parseFloat(value);
    if (!v || v <= 0) return;
    onSave(roundKg(v));
  }

  const dd = current && prev ? current.kg - prev.kg : null;
  const goalDiff = current && goal != null ? current.kg - goal : null;

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-default)] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)]">⚖️ {t("journal.weight.section")}</span>
        {current && (
          <span className="rounded-[var(--radius-pill)] bg-[var(--color-success-bg)] px-2.5 py-0.5 text-[var(--text-xs)] font-medium text-[var(--color-success-text)]">
            {t("journal.weight.recorded", { kg: current.kg })}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" onClick={() => step(-0.1)}>
          −
        </Button>
        <Input type="number" step={0.1} min={0} value={value} onChange={(e) => setValue(e.target.value)} placeholder={t("journal.weight.placeholder")} className="w-24" />
        <Button size="sm" onClick={() => step(0.1)}>
          ＋
        </Button>
        <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">kg</span>
        <Button size="sm" variant="primary" onClick={handleSave}>
          {current ? t("journal.weight.saveEdit") : t("journal.weight.save")}
        </Button>
        {current && (
          <button onClick={onDelete} className="text-[var(--text-xs)] text-[var(--color-error)] hover:underline">
            {t("journal.weight.delete")}
          </button>
        )}
      </div>

      {(dd != null || goalDiff != null) && (
        <div className="flex flex-wrap gap-3 text-[var(--text-xs)]">
          {dd != null && <span className={dd <= 0 ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}>{t("journal.weight.vsPrev", { diff: dd.toFixed(1) })}</span>}
          {goalDiff != null && goal != null && (
            <span className={Math.abs(goalDiff) < WEIGHT_GOAL_EPSILON ? "font-bold text-[var(--color-success-text)]" : "text-[var(--color-text-secondary)]"}>
              {t("journal.weight.vsGoal", { goal, diff: goalDiff.toFixed(1) })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
