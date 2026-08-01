"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useMarketNews } from "@/lib/queries/useNews";
import { NewsList } from "@/components/news/NewsList";

const CATEGORIES = ["general", "forex", "crypto", "merger"] as const;

export function MarketNewsView() {
  const t = useT();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("general");
  const { data, isLoading, error } = useMarketNews(category);

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-[var(--text-sm)] ${
              category === c ? "bg-[var(--color-accent-primary)] text-white" : "bg-[var(--color-bg-badge)] text-[var(--color-text-secondary)]"
            }`}
          >
            {t(`news.category.${c}`)}
          </button>
        ))}
      </Card>
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : error || !data ? (
        <EmptyState title={t("news.error")} />
      ) : (
        <Card>
          <NewsList items={data.items} />
        </Card>
      )}
    </div>
  );
}
