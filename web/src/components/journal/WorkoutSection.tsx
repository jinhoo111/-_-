"use client";

import { useT } from "@/lib/i18n/LanguageProvider";

export function WorkoutSection({
  value,
  onSet,
}: {
  value: "done" | "off" | undefined;
  onSet: (val: "done" | "off") => void;
}) {
  const t = useT();

  const btn = (val: "done" | "off", emoji: string, labelKey: string, onBg: string, onFg: string) => {
    const on = value === val;
    return (
      <button
        type="button"
        onClick={() => onSet(val)}
        className="flex-1 rounded-[8px] border px-2.5 py-1.5 text-[var(--text-sm)] font-bold"
        style={{
          borderColor: on ? `var(${onFg})` : "var(--color-border-input)",
          background: on ? `var(${onBg})` : "var(--color-bg-surface)",
          color: on ? `var(${onFg})` : "var(--color-text-tertiary)",
        }}
      >
        {emoji} {t(labelKey)}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-default)] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)]">💪 {t("journal.workout.section")}</span>
        {value && (
          <span
            className="rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[var(--text-xs)] font-medium"
            style={{
              background: value === "done" ? "var(--color-success-bg)" : "var(--color-bg-overlay)",
              color: value === "done" ? "var(--color-success-text)" : "var(--color-text-muted)",
            }}
          >
            {value === "done" ? `💪 ${t("journal.workout.done")}` : `🛌 ${t("journal.workout.off")}`}
          </span>
        )}
      </div>
      <div className="flex gap-1.5">
        {btn("done", "💪", "journal.workout.done", "--color-success-bg", "--color-success-text")}
        {btn("off", "🛌", "journal.workout.off", "--color-bg-overlay", "--color-text-secondary")}
      </div>
    </div>
  );
}
