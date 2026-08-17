"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { StockSearchModal } from "@/components/richbuild/StockSearchModal";
import { useRichbuildRanking } from "@/lib/queries/useRichbuildRanking";
import { useHoldings } from "@/lib/queries/useHoldings";
import { useRichbuildMarket } from "@/lib/richbuild/MarketProvider";
import { RICHBUILD_THRESHOLDS } from "@/lib/richbuild/constants";
import { useT } from "@/lib/i18n/LanguageProvider";
import type { Market } from "@/lib/richbuild/types";

function heatTone(score: number): "negative" | "warning" | "neutral" {
  if (score >= RICHBUILD_THRESHOLDS.heatIndex.hot) return "negative";
  if (score >= RICHBUILD_THRESHOLDS.heatIndex.warm) return "warning";
  return "neutral";
}

export function RankingSection({ depth }: { depth: "guest" | "member" }) {
  const t = useT();
  const { market, setMarket } = useRichbuildMarket();
  const { data: rows, isLoading } = useRichbuildRanking(market, depth);
  const { holdings } = useHoldings();
  const [searchOpen, setSearchOpen] = useState(false);
  const list = rows ?? [];
  const heldTickers = new Set(holdings.map((h) => h.ticker));

  return (
    <Card id="ranking">
      <CardHeader
        title={t("richbuild.ranking.title")}
        subtitle={
          <span className="flex items-center gap-1.5">
            {depth === "guest" ? (
              <Link href="/login" className="inline-block">
                <Badge tone="warning" size="sm">
                  {t("richbuild.ranking.subtitleGuest")}
                </Badge>
              </Link>
            ) : (
              t("richbuild.ranking.subtitleMember")
            )}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={t("richbuild.search.title")}
              title={t("richbuild.search.title")}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--accent)]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
          </span>
        }
        action={
          <Tabs
            size="sm"
            items={[
              { id: "kr", label: t("richbuild.ranking.marketKr") },
              { id: "us", label: t("richbuild.ranking.marketUs") },
            ]}
            value={market}
            onChange={(v) => setMarket(v as Market)}
          />
        }
      />
      {isLoading ? null : list.length === 0 ? (
        <EmptyState glyph="○" title={t("richbuild.ranking.emptyTitle")} description={t("richbuild.ranking.emptyDescription")} />
      ) : (
        <div className="scroll-thin flex max-h-[420px] flex-col divide-y divide-[var(--border-default)] overflow-y-auto pr-3">
          {list.map((row) => (
            <div key={row.ticker} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="w-5 shrink-0 text-[var(--text-sm)] text-[var(--text-muted)]">{row.rank.toString().padStart(2, "0")}</span>
                <span className="truncate text-[var(--text-sm)] font-medium text-[var(--text-primary)]">{row.name}</span>
                {heldTickers.has(row.ticker) && (
                  <Badge tone="accent" size="sm" className="shrink-0">
                    {t("richbuild.ranking.held")}
                  </Badge>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={heatTone(row.heatScore)} size="sm">
                  {row.heatScore}
                </Badge>
                <Link
                  href={`/holding/${encodeURIComponent(row.ticker)}`}
                  aria-label={t("richbuild.search.title")}
                  title={t("richbuild.search.title")}
                  className="flex h-5 w-5 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--accent)]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      {searchOpen && <StockSearchModal onClose={() => setSearchOpen(false)} />}
    </Card>
  );
}
