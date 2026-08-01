"use client";

import { useT } from "@/lib/i18n/LanguageProvider";

export type SecurityView = "events" | "voc" | "notice" | "accounts";

const VIEWS: SecurityView[] = ["events", "voc", "notice", "accounts"];

export function SecurityTabs({ view, onChange }: { view: SecurityView; onChange: (v: SecurityView) => void }) {
  const t = useT();
  return (
    <div className="flex gap-1 rounded-[var(--radius-control)] border border-[var(--color-border-default)] p-1">
      {VIEWS.map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-[var(--radius-control)] px-3 py-1.5 text-[var(--text-md)] font-medium ${
            view === v
              ? "bg-[var(--color-accent-primary)] text-[var(--color-accent-on)]"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-overlay)]"
          }`}
        >
          {t(`security.tab.${v}`)}
        </button>
      ))}
    </div>
  );
}
