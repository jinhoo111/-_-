"use client";

import { useT } from "@/lib/i18n/LanguageProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import type { NewsItem } from "@/lib/news/constants";

export function NewsList({ items }: { items: NewsItem[] }) {
  const t = useT();
  if (!items.length) return <EmptyState title={t("news.empty")} />;
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <a
          key={`${item.url}-${i}`}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-[var(--radius-control)] border border-[var(--color-border-faint)] p-3 hover:bg-[var(--color-bg-overlay)]"
        >
          <p className="text-[var(--text-md)] font-medium text-[var(--color-text-primary)]">{item.headline}</p>
          {item.summary && (
            <p className="mt-1 line-clamp-2 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{item.summary}</p>
          )}
          <p className="mt-1 text-[var(--text-2xs)] text-[var(--color-text-tertiary)]">
            {item.source} · {new Date(item.datetime * 1000).toLocaleString()}
          </p>
        </a>
      ))}
    </div>
  );
}
