"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useCompanyNews, useAnalystRating } from "@/lib/queries/useNews";
import { NewsList } from "@/components/news/NewsList";
import { NewsCardSkeleton } from "@/components/news/NewsCardSkeleton";
import { RatingCard } from "@/components/news/RatingCard";

const COMPANY_NEWS_LIMIT = 15;

export function CompanyNewsView() {
  const t = useT();
  const [input, setInput] = useState("");
  const [symbol, setSymbol] = useState<string | null>(null);

  const news = useCompanyNews(symbol);
  const rating = useAnalystRating(symbol);

  function handleSearch() {
    const v = input.trim().toUpperCase();
    setSymbol(v || null);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={t("news.company.searchPlaceholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-48"
        />
        <Button size="sm" onClick={handleSearch}>
          {t("news.company.search")}
        </Button>
      </Card>

      {!symbol ? (
        <EmptyState title={t("news.company.empty")} />
      ) : (
        <>
          <div>
            <p className="mb-2 text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("news.rating.title")}</p>
            {rating.isLoading ? (
              <NewsCardSkeleton count={2} />
            ) : rating.error ? (
              <EmptyState title={t("news.error")} onRetry={() => rating.refetch()} retryLabel={t("news.retry")} />
            ) : rating.data ? (
              <RatingCard symbol={rating.data.symbol} recommendation={rating.data.recommendation} priceTarget={rating.data.priceTarget} />
            ) : null}
          </div>
          {news.isLoading ? (
            <NewsCardSkeleton count={4} />
          ) : news.error || !news.data ? (
            <EmptyState title={t("news.error")} onRetry={() => news.refetch()} retryLabel={t("news.retry")} />
          ) : (
            <Card>
              <NewsList items={news.data.items} limit={COMPANY_NEWS_LIMIT} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
