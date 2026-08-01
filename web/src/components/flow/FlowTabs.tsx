"use client";

import { useT } from "@/lib/i18n/LanguageProvider";

export type FlowView = "krRank" | "insider" | "f13";

export function FlowTabs({ view, onChange }: { view: FlowView; onChange: (v: FlowView) => void }) {
  const t = useT();
  const tabs: { key: FlowView; labelKey: string }[] = [
    { key: "krRank", labelKey: "flow.tab.krRank" },
    { key: "insider", labelKey: "flow.tab.insider" },
    { key: "f13", labelKey: "flow.tab.f13" },
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
