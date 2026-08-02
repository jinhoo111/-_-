"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LanguageProvider";
import { useRegFeeds, useRegSearch } from "@/lib/queries/useResearch";
import { RssList } from "@/components/news/RssList";
import { REG_QUICK_LINKS_US, REG_QUICK_LINKS_KR, type RssItem } from "@/lib/news/constants";

function QuickLinksRow() {
  const t = useT();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-0.5 text-[var(--text-xs)] text-[var(--color-text-tertiary)]">🇺🇸</span>
        {REG_QUICK_LINKS_US.map((l) => (
          <a
            key={l.key}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[var(--radius-pill)] bg-[var(--color-bg-badge)] px-2 py-0.5 text-[var(--text-xs)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-overlay)]"
          >
            {t(l.labelKey)}
          </a>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-0.5 text-[var(--text-xs)] text-[var(--color-text-tertiary)]">🇰🇷</span>
        {REG_QUICK_LINKS_KR.map((l) => (
          <a
            key={l.key}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[var(--radius-pill)] bg-[var(--color-bg-badge)] px-2 py-0.5 text-[var(--text-xs)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-overlay)]"
          >
            {t(l.labelKey)}
          </a>
        ))}
      </div>
    </div>
  );
}

function matchesQuery(item: RssItem, q: string) {
  const needle = q.toLowerCase();
  return item.title.toLowerCase().includes(needle) || item.summary.toLowerCase().includes(needle);
}

export function RegFeedsView() {
  const t = useT();
  const { data, isLoading, isFetching, error, refetch } = useRegFeeds();
  const [input, setInput] = useState("");
  const [keyword, setKeyword] = useState<string | null>(null);
  const search = useRegSearch(keyword);

  const trimmed = input.trim();

  const filtered = useMemo(() => {
    if (!data || !trimmed) return null;
    return {
      us: data.us.filter((it) => matchesQuery(it, trimmed)),
      kr: data.kr.filter((it) => matchesQuery(it, trimmed)),
    };
  }, [data, trimmed]);

  function handleLiveSearch() {
    const v = input.trim();
    setKeyword(v || null);
  }

  function handleClear() {
    setInput("");
    setKeyword(null);
  }

  const showingResults = trimmed.length > 0;
  const liveItems = keyword ? search.data?.items ?? null : null;

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-start justify-between gap-3">
        <QuickLinksRow />
        <div className="flex flex-shrink-0 items-center gap-2">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              isFetching ? "bg-[var(--color-warning)]" : data ? "bg-[var(--color-success-text)]" : "bg-[var(--color-text-muted)]"
            }`}
          />
          <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
            {isFetching ? t("research.reg.status.loading") : data ? new Date(data.builtAt).toLocaleTimeString() : t("research.reg.status.waiting")}
          </span>
          <Button size="sm" onClick={() => refetch()} disabled={isFetching}>
            ↻ {t("research.reg.refresh")}
          </Button>
        </div>
      </Card>

      <Card className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={t("research.search.placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLiveSearch()}
          className="w-56"
        />
        <Button size="sm" onClick={handleLiveSearch}>
          {t("research.search.button")}
        </Button>
        {showingResults && (
          <Button size="sm" onClick={handleClear}>
            ✕ {t("research.search.clear")}
          </Button>
        )}
      </Card>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : error || !data ? (
        <EmptyState title={t("news.error")} />
      ) : !showingResults ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <p className="mb-2 text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("research.reg.us.title")}</p>
            <RssList items={data.us} />
          </Card>
          <Card>
            <p className="mb-2 text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{t("research.reg.kr.title")}</p>
            <RssList items={data.kr} />
          </Card>
        </div>
      ) : keyword ? (
        search.isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : search.error || !liveItems ? (
          <EmptyState title={t("news.error")} />
        ) : (
          <Card>
            <p className="mb-2 text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">
              🔎 {trimmed} — {t("research.search.resultsCount", { count: liveItems.length })}
            </p>
            <RssList items={liveItems} />
          </Card>
        )
      ) : filtered ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <p className="mb-2 text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">
              🔎 {t("research.reg.us.title")} — {t("research.search.resultsCount", { count: filtered.us.length })}
            </p>
            <RssList items={filtered.us} />
          </Card>
          <Card>
            <p className="mb-2 text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">
              🔎 {t("research.reg.kr.title")} — {t("research.search.resultsCount", { count: filtered.kr.length })}
            </p>
            <RssList items={filtered.kr} />
          </Card>
        </div>
      ) : null}
    </div>
  );
}
