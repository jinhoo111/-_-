"use client";

import { useT } from "@/lib/i18n/LanguageProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { REG_SOURCE_META, type RssItem } from "@/lib/news/constants";

export function RssList({ items }: { items: RssItem[] }) {
  const t = useT();
  if (!items.length) return <EmptyState title={t("news.empty")} />;
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        const meta = REG_SOURCE_META[item.source];
        return (
          <div
            key={`${item.link}-${i}`}
            className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border-default)] p-3"
          >
            <div className="mb-1 flex items-start justify-between gap-2">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="line-clamp-2 min-w-0 flex-1 break-words text-[var(--text-md)] font-semibold leading-snug text-[var(--color-text-primary)] hover:underline"
              >
                {item.title}
              </a>
              {meta && (
                <span
                  className="shrink-0 rounded-[20px] px-2 py-0.5 text-[var(--text-xs)] font-bold whitespace-nowrap"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.label}
                </span>
              )}
            </div>
            {item.summary && (
              <p className="line-clamp-2 mb-1 break-words text-[var(--text-sm)] leading-snug text-[var(--color-text-subtle)]">
                {item.summary}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2.5 text-[var(--text-xs)] text-[var(--color-text-muted)]">
              <span>{meta?.label ?? item.source}</span>
              {item.date && <span>{new Date(item.date).toLocaleString()}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
