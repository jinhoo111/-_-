"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { useRichbuildIndicator } from "@/lib/queries/useRichbuildIndicator";
import { RICHBUILD_THRESHOLDS } from "@/lib/richbuild/constants";
import type { Holding } from "@/lib/richbuild/types";

function formatPrice(price: number, market: "kr" | "us") {
  return market === "kr" ? `₩${Math.round(price).toLocaleString()}` : `$${price.toFixed(2)}`;
}

export function HoldingCard({ holding }: { holding: Holding }) {
  const { data, isLoading } = useRichbuildIndicator(holding.ticker, holding.buyPrice);

  if (isLoading || !data) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
    );
  }

  const { stopLoss, price } = data;
  const severe = stopLoss.lossSeverity != null && stopLoss.lossSeverity >= RICHBUILD_THRESHOLDS.lossSeverity.high;
  const tone = stopLoss.lossSeverity == null ? "neutral" : severe ? "negative" : "positive";

  const toneClass =
    tone === "negative"
      ? "border-[var(--color-error-border)] bg-[var(--color-error-subtle)]"
      : tone === "positive"
        ? "border-[var(--color-success-border)] bg-[var(--color-success-bg-light)]"
        : "border-[var(--border-default)]";

  return (
    <Link
      href={`/richbuild/holding/${encodeURIComponent(holding.ticker)}`}
      className={`block rounded-[var(--radius-lg)] border p-4 transition-colors ${toneClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display font-semibold text-[var(--text-primary)]">{holding.name}</div>
          <div className="mt-1 text-[var(--text-sm)] text-[var(--text-secondary)]">&ldquo;{stopLoss.sentence}&rdquo;</div>
          {stopLoss.breakEvenPct != null && stopLoss.breakEvenPct > 0 && (
            <div className="mt-1 text-[var(--text-xs)] text-[var(--text-muted)]">
              Needs +{stopLoss.breakEvenPct.toFixed(1)}% to break even
            </div>
          )}
        </div>
        <div className="shrink-0 text-right font-mono text-[var(--text-sm)] text-[var(--text-primary)]">
          {formatPrice(price, holding.market)}
        </div>
      </div>
    </Link>
  );
}
