"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GLU_SLOTS, glucoseSort, gluRangeHintKey, gluSlotLabelKey, gluStatusColor, glucoseStatus } from "@/lib/journal/constants";
import type { GlucoseEntry, GlucoseSlot } from "@/lib/types/userData";
import { useT } from "@/lib/i18n/LanguageProvider";

export function GlucoseSection({
  date,
  entries,
  onSave,
  onDelete,
}: {
  date: string;
  entries: GlucoseEntry[];
  onSave: (slot: GlucoseSlot, mgdl: number) => void;
  onDelete: (slot: GlucoseSlot) => void;
}) {
  const t = useT();
  const [slot, setSlot] = useState<GlucoseSlot>("fasting");

  const todays = entries.filter((e) => e.date === date && e.mgdl > 0);
  const current = todays.find((e) => e.slot === slot);

  const [value, setValue] = useState(current ? String(current.mgdl) : "");

  function selectSlot(next: GlucoseSlot) {
    setSlot(next);
    const forSlot = todays.find((e) => e.slot === next);
    setValue(forSlot ? String(forSlot.mgdl) : "");
  }

  function step(delta: number) {
    const base = parseInt(value, 10) || 0;
    setValue(String(Math.max(0, base + delta)));
  }

  function handleSave() {
    const v = parseInt(value, 10);
    if (!v || v <= 0) return;
    onSave(slot, v);
  }

  const sorted = [...todays].sort(glucoseSort);

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-default)] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)]">🩸 {t("journal.glucose.section")}</span>
        {current && (
          <span className="rounded-[var(--radius-pill)] bg-[var(--color-info-bg)] px-2.5 py-0.5 text-[var(--text-xs)] font-medium text-[var(--color-info)]">
            {t("journal.glucose.recorded", { slot: t(gluSlotLabelKey(slot)), mgdl: current.mgdl })}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {GLU_SLOTS.map((s) => {
          const on = s === slot;
          const has = todays.some((e) => e.slot === s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => selectSlot(s)}
              className={`rounded-[var(--radius-control)] border px-2.5 py-1 text-[var(--text-sm)] font-medium ${
                on
                  ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-bg)] text-[var(--color-accent-primary)]"
                  : "border-[var(--color-border-input)] bg-[var(--color-bg-surface)] text-[var(--color-text-tertiary)]"
              }`}
            >
              {t(gluSlotLabelKey(s))}
              {has ? " ✓" : ""}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" onClick={() => step(-1)}>
          −
        </Button>
        <Input
          type="number"
          step={1}
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("journal.glucose.placeholder")}
          className="w-24"
        />
        <Button size="sm" onClick={() => step(1)}>
          ＋
        </Button>
        <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">mg/dL</span>
        <Button size="sm" variant="primary" onClick={handleSave}>
          {current ? t("journal.glucose.saveEdit") : t("journal.glucose.save")}
        </Button>
        {current && (
          <button onClick={() => onDelete(slot)} className="text-[var(--text-xs)] text-[var(--color-error)] hover:underline">
            {t("journal.glucose.delete")}
          </button>
        )}
      </div>

      <div className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{t(gluRangeHintKey(slot))}</div>

      {sorted.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {sorted.map((e) => {
            const st = glucoseStatus(e.slot, e.mgdl);
            const col = gluStatusColor(st.key);
            return (
              <div key={e.slot} className="flex items-center gap-2 text-[var(--text-sm)]">
                <span className="min-w-[64px] text-[var(--color-text-secondary)]">{t(gluSlotLabelKey(e.slot))}</span>
                <span className="font-mono font-bold">{e.mgdl}</span>
                <span className="rounded-[var(--radius-pill)] px-2 py-0.5 text-[var(--text-xs)]" style={{ background: `var(${col.bg})`, color: `var(${col.fg})` }}>
                  ● {t(st.labelKey)}
                </span>
                <button onClick={() => onDelete(e.slot)} className="ml-auto text-[var(--text-xs)] text-[var(--color-error)] hover:underline">
                  {t("journal.glucose.delete")}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-[var(--text-xs)] leading-relaxed text-[var(--color-text-tertiary)]">ⓘ {t("journal.glucose.disclaimer")}</div>
    </div>
  );
}
