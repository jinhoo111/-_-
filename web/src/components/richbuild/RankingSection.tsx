"use client";

import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRichbuildRanking } from "@/lib/queries/useRichbuildRanking";
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

  return (
    <Card id="ranking">
      <CardHeader
        title={t("richbuild.ranking.title")}
        subtitle={
          depth === "guest" ? (
            <Link href="/richbuild/login" className="inline-block">
              <Badge tone="warning" size="sm">
                {t("richbuild.ranking.subtitleGuest")}
              </Badge>
            </Link>
          ) : (
            t("richbuild.ranking.subtitleMember")
          )
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
      {isLoading ? null : !rows || rows.length === 0 ? (
        <EmptyState glyph="○" title={t("richbuild.ranking.emptyTitle")} description={t("richbuild.ranking.emptyDescription")} />
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border-default)]">
          {rows.map((row) => (
            <div key={row.ticker} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-5 shrink-0 text-[var(--text-sm)] text-[var(--text-muted)]">{row.rank.toString().padStart(2, "0")}</span>
                <span className="truncate text-[var(--text-sm)] font-medium text-[var(--text-primary)]">{row.name}</span>
              </div>
              <Badge tone={heatTone(row.heatScore)} size="sm">
                {row.heatScore}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
