"use client";

import { useT } from "@/lib/i18n/LanguageProvider";

export type ResearchView = "sites" | "regFeeds";

export function ResearchTabs({ view, onChange }: { view: ResearchView; onChange: (v: ResearchView) => void }) {
  const t = useT();
  const tabs: { key: ResearchView; labelKey: string }[] = [
    { key: "sites", labelKey: "research.tab.sites" },
    { key: "regFeeds", labelKey: "research.tab.regFeeds" },
  ];
  return (
    <div className="flex gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-[var(--text-sm)] ${
            view === tab.key ? "bg-[var(--color-accent-primary)] text-white" : "bg-[var(--color-bg-badge)] text-[var(--color-text-secondary)]"
          }`}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  );
}
