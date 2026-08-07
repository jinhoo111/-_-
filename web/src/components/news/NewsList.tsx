"use client";

import { useT } from "@/lib/i18n/LanguageProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useUserData, useUpdateUserData } from "@/lib/queries/useUserData";
import type { NewsItem } from "@/lib/news/constants";

function formatNewsTime(datetime: number) {
  const d = new Date(datetime * 1000);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hh}:${mm}`;
}

export function NewsList({ items, limit }: { items: NewsItem[]; limit?: number }) {
  const t = useT();
  const { data: userData } = useUserData();
  const updateUserData = useUpdateUserData();
  const { show } = useToast();
  const visibleItems = typeof limit === "number" ? items.slice(0, limit) : items;

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
      {visibleItems.map((item, i) => {
        const related = item.related
          ? item.related
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 4)
          : [];
        return (
          <div
            key={`${item.url}-${i}`}
            className="flex items-start justify-between gap-2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-4 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-2)] sm:p-5"
          >
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[var(--text-xs)] text-[var(--text-muted)]">
                <span className="font-semibold text-[var(--text-secondary)]">{item.source || "—"}</span>
                <span>·</span>
                <span>{formatNewsTime(item.datetime)}</span>
              </div>
              <p className="mt-1.5 text-[var(--text-md)] font-semibold leading-[var(--leading-snug)] text-[var(--text-primary)]">
                {item.headline}
              </p>
              {related.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {related.map((sym) => (
                    <span
                      key={sym}
                      className="rounded-[var(--radius-pill)] bg-[var(--surface-2)] px-2 py-0.5 font-mono text-[var(--text-xs)] font-medium text-[var(--text-secondary)]"
                    >
                      {sym}
                    </span>
                  ))}
                </div>
              )}
              {item.summary && (
                <p className="mt-1.5 line-clamp-2 text-[var(--text-sm)] leading-[var(--leading-normal)] text-[var(--text-secondary)]">
                  {item.summary}
                </p>
              )}
            </a>
            <button
              onClick={() => handleSaveToJournal(item)}
              title={t("news.saveToJournal")}
              className="shrink-0 rounded-[var(--radius-md)] px-2.5 py-1.5 text-[var(--text-xs)] font-medium text-[var(--text-muted)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]"
            >
              📝 {t("news.saveToJournal")}
            </button>
          </div>
        );
      })}
    </div>
  );
}
