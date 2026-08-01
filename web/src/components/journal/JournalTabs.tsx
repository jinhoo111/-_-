"use client";

import { useT } from "@/lib/i18n/LanguageProvider";

export type JournalView = "calendar" | "report" | "archive" | "philosophy";

export function JournalTabs({ view, onChange }: { view: JournalView; onChange: (view: JournalView) => void }) {
  const t = useT();
  const tabs: { key: JournalView; labelKey: string }[] = [
    { key: "calendar", labelKey: "journal.tab.calendar" },
    { key: "report", labelKey: "journal.tab.report" },
    { key: "archive", labelKey: "journal.tab.archive" },
    { key: "philosophy", labelKey: "journal.tab.philosophy" },
  ];

  return (
    <div className="flex gap-1.5">
      {tabs.map(({ key, labelKey }) => {
        const active = view === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`rounded-[var(--radius-pill)] px-3.5 py-1.5 text-[var(--text-md)] font-medium ${
              active ? "bg-[var(--color-accent-primary)] text-white" : "bg-[var(--color-bg-badge)] text-[var(--color-text-secondary)]"
            }`}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
