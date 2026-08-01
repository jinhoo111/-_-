"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useRegSearch } from "@/lib/queries/useResearch";
import { RssList } from "@/components/news/RssList";

export function RegSearchView() {
  const t = useT();
  const [input, setInput] = useState("");
  const [keyword, setKeyword] = useState<string | null>(null);
  const { data, isLoading, error } = useRegSearch(keyword);

  function handleSearch() {
    const v = input.trim();
    setKeyword(v || null);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={t("research.search.placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-56"
        />
        <Button size="sm" onClick={handleSearch}>
          {t("news.company.search")}
        </Button>
      </Card>

      {!keyword ? (
        <EmptyState title={t("research.search.empty")} />
      ) : isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : error || !data ? (
        <EmptyState title={t("news.error")} />
      ) : (
        <Card>
          <RssList items={data.items} />
        </Card>
      )}
    </div>
  );
}
