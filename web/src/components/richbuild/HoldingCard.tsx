"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { PriceChange } from "@/components/ui/PriceChange";
import { useRichbuildIndicator } from "@/lib/queries/useRichbuildIndicator";
import { useFxRates } from "@/lib/queries/useIndices";
import { useDisplayPrefs } from "@/lib/displayPrefs";
import { convertToDisplay, formatCurrency } from "@/lib/richbuild/currency";
import { SparklesIcon } from "@/components/richbuild/SparklesIcon";
import { useT } from "@/lib/i18n/LanguageProvider";
import type { Holding } from "@/lib/richbuild/types";

function formatQty(qty: number) {
  return Number.isInteger(qty) ? qty.toLocaleString("en-US") : qty.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export function HoldingCard({ holding }: { holding: Holding }) {
  const t = useT();
  const { data, isLoading } = useRichbuildIndicator(holding.ticker, holding.buyPrice);
  const { currency } = useDisplayPrefs();
  const { data: fxRates } = useFxRates(true);

  if (isLoading || !data) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
    );
  }

  const { stopLoss, price, history } = data;

  // 1-day change % from the trailing closes (last close vs the day before) — shown
  // as a convention-aware badge next to the price. History normally has ≥2 points.
  const prevClose = history && history.length >= 2 ? history[history.length - 2] : undefined;
  const changePct = prevClose != null && prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : null;

  // Cards stay the neutral surface color regardless of severity (same look as the
  // guest view); the AI insight panel is what carries the signal color.
  return (
    <Link
      href={`/holding/${encodeURIComponent(holding.ticker)}`}
      className="block rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4 transition-colors hover:bg-[var(--surface-2)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display font-semibold text-[var(--text-primary)]">{holding.name}</div>
          <div className="mt-0.5 text-[var(--text-xs)] text-[var(--text-muted)]">
            {t("richbuild.holdings.shares", { qty: formatQty(holding.quantity) })}
            {holding.buyPrice != null && (
              <>
                {" "}· {t("richbuild.holdings.buyPrice", { price: formatCurrency(convertToDisplay(holding.buyPrice, holding.market, currency, fxRates), currency) })}
              </>
            )}
          </div>
          <div className="mt-2">
            {stopLoss.quadrant ? (
              <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--accent-soft-border)] bg-[var(--accent-soft)] px-3 py-2">
                <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                <p
                  className="text-[var(--text-sm)] leading-snug text-[var(--accent)]"
                  style={{ textShadow: "0 0 12px var(--accent-soft)" }}
                >
                  {stopLoss.sentence}
                </p>
              </div>
            ) : (
              <Badge tone="warning" size="sm">
                {stopLoss.sentence}
              </Badge>
            )}
          </div>
          {stopLoss.breakEvenPct != null && stopLoss.breakEvenPct > 0 && (
            <div className="mt-1 text-[var(--text-xs)] text-[var(--text-muted)]">
              {t("richbuild.holdings.breakEven", { pct: stopLoss.breakEvenPct.toFixed(1) })}
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <span className="font-mono text-[var(--text-sm)] text-[var(--text-primary)]">
              {formatCurrency(convertToDisplay(price, holding.market, currency, fxRates), currency)}
            </span>
            {changePct != null && <PriceChange value={changePct} size="sm" badge />}
          </div>
          <div className="mt-1 font-mono text-[var(--text-xs)] text-[var(--text-muted)]">
            {t("richbuild.holdings.total", { amount: formatCurrency(convertToDisplay(price * holding.quantity, holding.market, currency, fxRates), currency) })}
          </div>
        </div>
      </div>
    </Link>
  );
}
