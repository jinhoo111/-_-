"use client";

import { useT } from "@/lib/i18n/LanguageProvider";

export type NewsView = "market" | "company" | "naver";

export function NewsTabs({ view, onChange }: { view: NewsView; onChange: (v: NewsView) => void }) {
  const t = useT();
  const tabs: { key: NewsView; labelKey: string }[] = [
    { key: "market", labelKey: "news.tab.market" },
    { key: "company", labelKey: "news.tab.company" },
    { key: "naver", labelKey: "news.tab.naver" },
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
