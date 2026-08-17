"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrendChart } from "@/components/richbuild/TrendChart";
import { HeatGauge } from "@/components/richbuild/HeatGauge";
import { SparklesIcon } from "@/components/richbuild/SparklesIcon";
import { QuadrantPlot, AxisMeter } from "@/components/richbuild/StopLossVisuals";
import { RangeDropdown, type RangeKey } from "@/components/ui/RangeDropdown";
import { PriceChange } from "@/components/ui/PriceChange";
import { useHoldings } from "@/lib/queries/useHoldings";
import { useRichbuildIndicator } from "@/lib/queries/useRichbuildIndicator";
import { useHistory } from "@/lib/queries/useIndices";
import { formatCurrency } from "@/lib/richbuild/currency";
import { useT } from "@/lib/i18n/LanguageProvider";

// "7D" dropped entirely (not just relabeled) — it fetches Yahoo's range=5d (5 trading
// days, weekends excluded), never actually delivering a week's worth of daily points,
// and there's no other daily-close range that honestly represents "1 week" here.
const RICHBUILD_RANGE_KEYS: RangeKey[] = ["1D", "1M", "3M", "9M", "YTD", "1Y", "All"];

const RANGE_NAME_KEY: Partial<Record<RangeKey, string>> = {
  "1D": "portfolio.range.1d",
  "1M": "portfolio.range.1m",
  "3M": "portfolio.range.3m",
  "9M": "portfolio.range.9m",
  YTD: "portfolio.range.ytd",
  "1Y": "portfolio.range.1y",
  All: "portfolio.range.all",
};

function formatQty(qty: number) {
  return Number.isInteger(qty) ? qty.toLocaleString("en-US") : qty.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

// Shared body for the Stop-Loss card — AI sentence + quadrant plot + the two axis
// meters. Unlocked it renders fully; when Loss Severity is gated it renders behind a
// blur with an overlay CTA (instead of a plain-text message).
function StopLossBody({ lossSeverity, downtrendSignal, sentence }: { lossSeverity: number; downtrendSignal: number; sentence: string }) {
  const t = useT();
  return (
    <>
      <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--accent-soft-border)] bg-[var(--accent-soft)] px-3 py-2">
        <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
        <p className="text-[var(--text-sm)] leading-snug text-[var(--accent)]" style={{ textShadow: "0 0 12px var(--accent-soft)" }}>
          {sentence}
        </p>
      </div>
      <div className="mt-2 flex items-stretch gap-3">
        <div className="w-[170px] shrink-0">
          <QuadrantPlot lossSeverity={lossSeverity} downtrendSignal={downtrendSignal} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
          <AxisMeter label={t("richbuild.detail.lossSeverityLabel")} value={lossSeverity} />
          <AxisMeter label={t("richbuild.detail.downtrendSignalLabel")} value={downtrendSignal} />
        </div>
      </div>
    </>
  );
}

export default function HoldingDetailPage() {
  const t = useT();
  const params = useParams<{ ticker: string }>();
  const ticker = decodeURIComponent(params.ticker);
  const { holdings } = useHoldings();
  const holding = holdings.find((h) => h.ticker === ticker);
  const market = holding?.market ?? (/\.(KS|KQ)$/i.test(ticker) ? "kr" : "us");
  const { data, isLoading, isError } = useRichbuildIndicator(ticker, holding?.buyPrice ?? null);
  const [range, setRange] = useState<RangeKey>("3M");
  const { data: historyData, isFetching: historyPending } = useHistory([ticker], range);
  // No fallback to the indicator route's fixed 3-month history here on purpose: falling
  // back to it while a different range is loading briefly showed the WRONG range's shape
  // under the newly-selected range's label (e.g. picking "7D" would flash the 3-month
  // curve) -- show a skeleton instead of any data until this exact range has loaded.
  const chartHistory = historyData?.[ticker] ?? [];
  const chartReady = !historyPending && chartHistory.length > 1;

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return <EmptyState glyph="!" title={t("richbuild.detail.couldNotLoad")} description={t("richbuild.detail.couldNotLoadDesc")} />;
  }

  const { stopLoss, heat, price, history } = data;
  // Standard 1-day change (today's close vs yesterday's close) — the holding card
  // shows exactly this value, so the detail chart's 1D badge must match it (the
  // intraday first-bar→last-bar change differs by the overnight gap).
  const oneDayChange =
    history && history.length >= 2 && history[history.length - 2] > 0
      ? ((price - history[history.length - 2]) / history[history.length - 2]) * 100
      : null;
  // Stock prices/chart stay in the stock's native market currency — the display-currency
  // toggle only affects the user's portfolio total (added separately).
  const formatPrice = (v: number) => formatCurrency(v, market === "kr" ? "KRW" : "USD");

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-6">
      {/* Header: name/entry on the left, live price + 1D change on the right */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[var(--text-lg)] font-semibold text-[var(--text-primary)]">{holding?.name ?? ticker}</h1>
          <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">{ticker}</p>
          {holding?.buyPrice != null && (
            <p className="text-[var(--text-xs)] text-[var(--text-muted)]">
              {t("richbuild.holdings.buyPrice", { price: formatCurrency(holding.buyPrice, market === "kr" ? "KRW" : "USD") })}
            </p>
          )}
          {holding && (
            <p className="text-[var(--text-xs)] text-[var(--text-muted)]">
              {t("richbuild.holdings.shares", { qty: formatQty(holding.quantity) })} ·{" "}
              {t("richbuild.holdings.total", { amount: formatCurrency(price * holding.quantity, market === "kr" ? "KRW" : "USD") })}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-[var(--text-2xl)] font-semibold text-[var(--text-primary)]">
            {formatCurrency(price, market === "kr" ? "KRW" : "USD")}
          </div>
          {oneDayChange != null && (
            <div className="mt-1">
              <PriceChange value={oneDayChange} size="sm" badge />
            </div>
          )}
        </div>
      </div>

      {/* Chart spans ~2/3 on desktop; heat + stop-loss stack in the sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-[var(--text-xs)] text-[var(--text-muted)]">{t("richbuild.detail.trend")}</span>
            <RangeDropdown
              value={range}
              onChange={setRange}
              keys={RICHBUILD_RANGE_KEYS}
              names={Object.fromEntries(RICHBUILD_RANGE_KEYS.map((k) => [k, t(RANGE_NAME_KEY[k]!)])) as Record<RangeKey, string>}
            />
          </div>
          {historyPending ? (
            <div className="h-[420px]">
              <Skeleton className="h-full w-full" />
            </div>
          ) : chartReady ? (
            <div className="h-[420px]">
              <TrendChart data={chartHistory} formatPrice={formatPrice} changePctOverride={range === "1D" ? oneDayChange : undefined} />
            </div>
          ) : (
            <p className="py-4 text-center text-[var(--text-sm)] text-[var(--text-muted)]">{t("richbuild.detail.noChartData")}</p>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title={t("richbuild.detail.heatTitle")} />
            <HeatGauge score={heat.score} />
          </Card>

          <Card>
            <CardHeader title={t("richbuild.detail.stopLossTitle")} />
            {stopLoss.lossSeverity != null ? (
              <>
                <StopLossBody lossSeverity={stopLoss.lossSeverity} downtrendSignal={stopLoss.downtrendSignal} sentence={stopLoss.sentence} />
                {stopLoss.breakEvenPct != null && stopLoss.breakEvenPct > 0 && (
                  <p className="mt-3 text-[var(--text-xs)] text-[var(--text-muted)]">
                    {t("richbuild.holdings.breakEven", { pct: stopLoss.breakEvenPct.toFixed(1) })}
                  </p>
                )}
              </>
            ) : (
              <div className="relative">
                <div className="pointer-events-none select-none blur-[5px] opacity-70" aria-hidden="true">
                  <StopLossBody lossSeverity={0} downtrendSignal={stopLoss.downtrendSignal} sentence={stopLoss.sentence} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="flex max-w-[240px] flex-col items-center gap-2.5 text-center">
                    <p className="text-[var(--text-sm)] font-semibold leading-snug text-[var(--text-primary)]">
                      {stopLoss.buyPriceProvided
                        ? t("richbuild.detail.signUpToSeeLink")
                        : t("richbuild.detail.addBuyPriceCta")}
                    </p>
                    <Link
                      href={
                        stopLoss.buyPriceProvided
                          ? `/login?redirectTo=${encodeURIComponent(`/holding/${encodeURIComponent(ticker)}`)}`
                          : "/add"
                      }
                    >
                      <Button variant="primary" size="sm">
                        {stopLoss.buyPriceProvided ? t("richbuild.nav.login") : t("richbuild.holdings.addCta")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
            <p className="mt-2 text-[var(--text-xs)] text-[var(--text-muted)]">{t("richbuild.detail.asOfDate", { date: stopLoss.asOfDate })}</p>
            <p className="mt-2 text-[var(--text-xs)] text-[var(--text-muted)]">{t("richbuild.holdings.disclaimer")}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
