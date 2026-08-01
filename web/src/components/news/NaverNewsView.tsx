"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useNaverStockNews } from "@/lib/queries/useNews";
import { RssList } from "@/components/news/RssList";
import type { RssItem } from "@/lib/news/constants";

interface NaverNewsResponse {
  items?: { title: string; link: string; datetime?: string; source?: string }[];
}

export function NaverNewsView() {
  const t = useT();
  const [input, setInput] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const { data, isLoading, error } = useNaverStockNews(code);

  function handleSearch() {
    const v = input.trim();
    setCode(v || null);
  }

  const items: RssItem[] = (data as NaverNewsResponse | undefined)?.items?.map((it) => ({
    title: it.title,
    link: it.link,
    summary: "",
    date: it.datetime ?? "",
    source: it.source ?? "naver",
  })) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={t("news.naver.codePlaceholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-40"
        />
        <Button size="sm" onClick={handleSearch}>
          {t("news.company.search")}
        </Button>
      </Card>

      {!code ? (
        <EmptyState title={t("news.company.empty")} />
      ) : isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : error ? (
        <EmptyState title={t("news.error")} />
      ) : (
        <Card>
          <RssList items={items} />
        </Card>
      )}
    </div>
  );
}
