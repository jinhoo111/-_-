"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useCompanyNews, useAnalystRating } from "@/lib/queries/useNews";
import { NewsList } from "@/components/news/NewsList";

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
          {rating.data && (
            <Card>
              <p className="mb-2 text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("news.rating.title")}</p>
              {rating.data.priceTarget && (
                <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                  {t("news.rating.priceTarget")}: ${rating.data.priceTarget.targetMean.toFixed(2)} ({t("news.rating.range")}: $
                  {rating.data.priceTarget.targetLow.toFixed(2)}–${rating.data.priceTarget.targetHigh.toFixed(2)})
                </p>
              )}
              {rating.data.recommendation?.[0] && (
                <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                  {t("news.rating.trend")}: {t("news.rating.strongBuy")} {rating.data.recommendation[0].strongBuy} /{" "}
                  {t("news.rating.buy")} {rating.data.recommendation[0].buy} / {t("news.rating.hold")} {rating.data.recommendation[0].hold} /{" "}
                  {t("news.rating.sell")} {rating.data.recommendation[0].sell} / {t("news.rating.strongSell")} {rating.data.recommendation[0].strongSell}
                </p>
              )}
            </Card>
          )}
          {news.isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : news.error || !news.data ? (
            <EmptyState title={t("news.error")} />
          ) : (
            <Card>
              <NewsList items={news.data.items} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
