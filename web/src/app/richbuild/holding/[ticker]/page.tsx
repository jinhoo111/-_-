"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrendChart } from "@/components/richbuild/TrendChart";
import { HeatGauge } from "@/components/richbuild/HeatGauge";
import { RangeDropdown, type RangeKey } from "@/components/ui/RangeDropdown";
import { useHoldings } from "@/lib/queries/useHoldings";
import { useRichbuildIndicator } from "@/lib/queries/useRichbuildIndicator";
import { useHistory, useFxRates } from "@/lib/queries/useIndices";
import { useDisplayPrefs } from "@/lib/displayPrefs";
import { convertToDisplay, formatCurrency } from "@/lib/richbuild/currency";
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

export default function HoldingDetailPage() {
  const t = useT();
  const params = useParams<{ ticker: string }>();
  const ticker = decodeURIComponent(params.ticker);
  const { holdings } = useHoldings();
  const holding = holdings.find((h) => h.ticker === ticker);
  const market = holding?.market ?? (/\.(KS|KQ)$/i.test(ticker) ? "kr" : "us");
  const { data, isLoading, isError } = useRichbuildIndicator(ticker, holding?.buyPrice ?? null);
  const { currency } = useDisplayPrefs();
  const { data: fxRates } = useFxRates(true);
  const [range, setRange] = useState<RangeKey>("3M");
  const [showBreakdown, setShowBreakdown] = useState(false);
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

  const { stopLoss, heat, price } = data;
  const formatPrice = (v: number) => formatCurrency(convertToDisplay(v, market, currency, fxRates), currency);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[var(--text-lg)] font-semibold text-[var(--text-primary)]">{holding?.name ?? ticker}</h1>
          <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
            {ticker} · {formatCurrency(convertToDisplay(price, market, currency, fxRates), currency)}
          </p>
          {holding && (
            <p className="text-[var(--text-xs)] text-[var(--text-muted)]">
              {t("richbuild.holdings.shares", { qty: formatQty(holding.quantity) })} ·{" "}
              {t("richbuild.holdings.total", { amount: formatCurrency(convertToDisplay(price * holding.quantity, market, currency, fxRates), currency) })}
            </p>
          )}
        </div>
      </div>

      <Card>
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
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-[180px] w-full" />
          </div>
        ) : chartReady ? (
          <TrendChart data={chartHistory} height={180} formatPrice={formatPrice} />
        ) : (
          <p className="py-4 text-center text-[var(--text-sm)] text-[var(--text-muted)]">{t("richbuild.detail.noChartData")}</p>
        )}
      </Card>

      <Card>
        <CardHeader title={t("richbuild.detail.heatTitle")} />
        <HeatGauge score={heat.score} />
        <button
          type="button"
          onClick={() => setShowBreakdown((v) => !v)}
          className="mt-1 w-full text-center text-[var(--text-xs)] font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          {showBreakdown ? t("richbuild.detail.hideBreakdown") : t("richbuild.detail.showBreakdown")} {showBreakdown ? "︿" : "﹀"}
        </button>
        {showBreakdown && (
          <div className="mt-2 flex flex-col gap-1 border-t border-[var(--border-default)] pt-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
            <span>{t("richbuild.detail.volumeReturn", { vol: heat.volumeMultiple, z: heat.returnZ })}</span>
            {heat.retailNetBuyPct != null && <span>{t("richbuild.detail.retailNetBuy", { pct: heat.retailNetBuyPct })}</span>}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title={t("richbuild.detail.stopLossTitle")} />
        {stopLoss.quadrant ? (
          <p className="font-semibold text-[var(--text-primary)]">&ldquo;{stopLoss.sentence}&rdquo;</p>
        ) : (
          <Badge tone="warning" size="sm">
            {stopLoss.sentence}
          </Badge>
        )}
        <div className="mt-2 flex flex-col gap-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
          <span>
            {t("richbuild.detail.lossSeverityLabel")}{" "}
            {stopLoss.lossSeverity != null ? stopLoss.lossSeverity : stopLoss.buyPriceProvided ? "🔒" : t("richbuild.detail.addBuyPriceHint")}
          </span>
          <span>
            {t("richbuild.detail.downtrendSignalLabel")} {stopLoss.downtrendSignal}
          </span>
          {stopLoss.breakEvenPct != null && stopLoss.breakEvenPct > 0 && (
            <span>{t("richbuild.holdings.breakEven", { pct: stopLoss.breakEvenPct.toFixed(1) })}</span>
          )}
        </div>
        {stopLoss.buyPriceProvided && stopLoss.lossSeverity == null && (
          <Link
            href={`/richbuild/login?redirectTo=${encodeURIComponent(`/richbuild/holding/${encodeURIComponent(ticker)}`)}`}
            className="mt-2 inline-block text-[var(--text-sm)] font-semibold text-[var(--accent)]"
          >
            {t("richbuild.detail.signUpToSeeLink")}
          </Link>
        )}
        <p className="mt-3 text-[var(--text-xs)] text-[var(--text-muted)]">{t("richbuild.detail.asOfDate", { date: stopLoss.asOfDate })}</p>
        <p className="mt-3 text-[var(--text-xs)] text-[var(--text-muted)]">{t("richbuild.holdings.disclaimer")}</p>
      </Card>
    </div>
  );
}
