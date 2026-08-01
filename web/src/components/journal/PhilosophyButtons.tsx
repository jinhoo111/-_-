"use client";

import type { PhilosophyEntry, PhilosophyType } from "@/lib/types/userData";
import { useT } from "@/lib/i18n/LanguageProvider";

export function PhilosophyButtons({
  sourceId,
  philosophy,
  onToggle,
}: {
  sourceId: string;
  philosophy: PhilosophyEntry[];
  onToggle: (sourceId: string, type: PhilosophyType) => void;
}) {
  const t = useT();
  const entry = philosophy.find((p) => p.sourceId === sourceId);
  const isMust = entry?.type === "must";
  const isNever = entry?.type === "never";

  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => onToggle(sourceId, "must")}
        className="rounded-[5px] border px-1.5 py-0.5 text-[var(--text-xs)]"
        style={{
          borderColor: isMust ? "var(--color-success)" : "var(--color-border-input)",
          background: isMust ? "var(--color-success-bg)" : "var(--color-bg-surface)",
          color: isMust ? "var(--color-success-text)" : "var(--color-text-tertiary)",
        }}
      >
        {t(isMust ? "journal.philosophy.mustBtnOn" : "journal.philosophy.mustBtnOff")}
      </button>
      <button
        type="button"
        onClick={() => onToggle(sourceId, "never")}
        className="rounded-[5px] border px-1.5 py-0.5 text-[var(--text-xs)]"
        style={{
          borderColor: isNever ? "var(--color-error)" : "var(--color-border-input)",
          background: isNever ? "var(--color-error-bg)" : "var(--color-bg-surface)",
          color: isNever ? "var(--color-error-text)" : "var(--color-text-tertiary)",
        }}
      >
        {t(isNever ? "journal.philosophy.neverBtnOn" : "journal.philosophy.neverBtnOff")}
      </button>
    </div>
  );
}
