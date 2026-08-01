"use client";

import { useT } from "@/lib/i18n/LanguageProvider";

export type MonitorView = "card" | "table" | "radar";

const VIEWS: MonitorView[] = ["card", "table", "radar"];

export function MonitorViewTabs({ view, onChange }: { view: MonitorView; onChange: (v: MonitorView) => void }) {
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
          {t(`monitor.view.${v}`)}
        </button>
      ))}
    </div>
  );
}
