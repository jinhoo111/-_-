"use client";

import { useT } from "@/lib/i18n/LanguageProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useUserData, useUpdateUserData } from "@/lib/queries/useUserData";
import type { NewsItem } from "@/lib/news/constants";

export function NewsList({ items }: { items: NewsItem[] }) {
  const t = useT();
  const { data: userData } = useUserData();
  const updateUserData = useUpdateUserData();
  const { show } = useToast();

  function handleSaveToJournal(item: NewsItem) {
    if (!userData) return;
    const now = new Date().toISOString();
    const entry = {
      id: crypto.randomUUID(),
      text: `${item.headline}${item.summary ? " — " + item.summary : ""} (${item.url})`,
      tag: "general" as const,
      time: now,
      completedAt: now,
    };
    updateUserData({ memo_archive: [entry, ...userData.memo_archive] });
    show(t("news.savedToJournal"), "success");
  }

  if (!items.length) return <EmptyState title={t("news.empty")} />;
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div
          key={`${item.url}-${i}`}
          className="flex items-start justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--color-border-faint)] p-3 hover:bg-[var(--color-bg-overlay)]"
        >
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
            <p className="text-[var(--text-md)] font-medium text-[var(--color-text-primary)]">{item.headline}</p>
            {item.summary && (
              <p className="mt-1 line-clamp-2 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{item.summary}</p>
            )}
            <p className="mt-1 text-[var(--text-2xs)] text-[var(--color-text-tertiary)]">
              {item.source} · {new Date(item.datetime * 1000).toLocaleString()}
            </p>
          </a>
          <button
            onClick={() => handleSaveToJournal(item)}
            title={t("news.saveToJournal")}
            className="shrink-0 rounded-[var(--radius-control)] px-2 py-1 text-[var(--text-xs)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-badge)] hover:text-[var(--color-text-secondary)]"
          >
            📝 {t("news.saveToJournal")}
          </button>
        </div>
      ))}
    </div>
  );
}
