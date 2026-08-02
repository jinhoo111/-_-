"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useMarketNews } from "@/lib/queries/useNews";
import { NewsList } from "@/components/news/NewsList";
import { NewsCardSkeleton } from "@/components/news/NewsCardSkeleton";

const CATEGORIES = ["general", "forex", "crypto", "merger"] as const;
const MARKET_NEWS_LIMIT = 20;

export function MarketNewsView() {
  const t = useT();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("general");
  const { data, isLoading, error, refetch } = useMarketNews(category);

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
        <NewsCardSkeleton count={5} />
      ) : error || !data ? (
        <EmptyState title={t("news.error")} onRetry={() => refetch()} retryLabel={t("news.retry")} />
      ) : (
        <Card>
          <NewsList items={data.items} limit={MARKET_NEWS_LIMIT} />
        </Card>
      )}
    </div>
  );
}
