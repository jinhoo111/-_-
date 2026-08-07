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
    <div className="flex flex-col gap-2 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-card)]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between text-[var(--text-md)] font-semibold text-[var(--text-primary)]"
      >
        <span>{t("indices.settings")}</span>
        <span className="text-[var(--text-muted)]">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="flex flex-wrap gap-1.5">
          {SECTIONS.map(({ key, labelKey }) => {
            const on = !!settings[key];
            return (
              <button
                key={key}
                onClick={() => onToggle(key, !on)}
                className={`h-9 rounded-[var(--radius-pill)] border px-4 text-[var(--text-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                  on
                    ? "border-[var(--accent-soft-border)] bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                    : "border-[var(--border-default)] bg-[var(--surface-2)] font-medium text-[var(--text-secondary)]"
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
