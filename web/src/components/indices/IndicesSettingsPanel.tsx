"use client";

import { useState } from "react";
import { SECTIONS, type SectionKey } from "@/lib/indices/constants";
import { useT } from "@/lib/i18n/LanguageProvider";

export function IndicesSettingsPanel({
  settings,
  onToggle,
}: {
  settings: Record<SectionKey, boolean>;
  onToggle: (key: SectionKey, value: boolean) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-3xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-[18px_20px] shadow-[var(--shadow-card)]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]"
      >
        <span>{t("indices.settings")}</span>
        <span className="text-[var(--color-text-tertiary)]">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="flex flex-wrap gap-1.5">
          {SECTIONS.map(({ key, labelKey }) => {
            const on = !!settings[key];
            return (
              <button
                key={key}
                onClick={() => onToggle(key, !on)}
                className={`rounded-[var(--radius-pill)] px-3 py-1 text-[var(--text-sm)] ${
                  on ? "bg-[var(--color-accent-primary)] text-white" : "bg-[var(--color-bg-badge)] text-[var(--color-text-secondary)]"
                }`}
              >
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
