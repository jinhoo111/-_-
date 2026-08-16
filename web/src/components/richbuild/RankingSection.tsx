"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRichbuildRanking } from "@/lib/queries/useRichbuildRanking";
import { useRichbuildMarket } from "@/lib/richbuild/MarketProvider";
import { RICHBUILD_THRESHOLDS } from "@/lib/richbuild/constants";

function heatTone(score: number): "negative" | "warning" | "neutral" {
  if (score >= RICHBUILD_THRESHOLDS.heatIndex.hot) return "negative";
  if (score >= RICHBUILD_THRESHOLDS.heatIndex.warm) return "warning";
  return "neutral";
}

// Market is a single global filter (top-right nav), not a per-card toggle — every
// market-scoped section on the page reads the same selection.
export function RankingSection({ depth }: { depth: "guest" | "member" }) {
  const { market } = useRichbuildMarket();
  const { data: rows, isLoading } = useRichbuildRanking(market, depth);

  return (
    <Card id="ranking">
      <CardHeader
        title="Today's Ranking"
        subtitle={depth === "guest" ? "Top 10 · fixed, no scroll" : "Top 50 · fixed frame, scrollable list"}
      />
      {isLoading ? null : !rows || rows.length === 0 ? (
        <EmptyState
          glyph="○"
          title="Ranking not available yet"
          description="The daily ranking batch hasn't run yet — check back after the next update."
        />
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
