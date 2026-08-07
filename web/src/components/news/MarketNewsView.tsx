"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChip } from "@/components/ui/FilterChip";
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
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <FilterChip key={c} label={t(`news.category.${c}`)} active={category === c} onClick={() => setCategory(c)} />
        ))}
      </div>
      {isLoading ? (
        <NewsCardSkeleton count={5} />
      ) : error || !data ? (
        <EmptyState title={t("news.error")} onRetry={() => refetch()} retryLabel={t("news.retry")} />
      ) : (
        <div className="flex flex-col gap-3">
          <NewsList items={data.items} limit={MARKET_NEWS_LIMIT} />
        </div>
      )}
    </div>
  );
}
