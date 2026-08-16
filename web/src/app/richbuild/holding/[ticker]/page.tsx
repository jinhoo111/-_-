"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sparkline } from "@/components/ui/Sparkline";
import { RangeDropdown, type RangeKey } from "@/components/ui/RangeDropdown";
import { useHoldings } from "@/lib/queries/useHoldings";
import { useRichbuildIndicator } from "@/lib/queries/useRichbuildIndicator";
import { useHistory, useFxRates } from "@/lib/queries/useIndices";
import { useDisplayPrefs } from "@/lib/displayPrefs";
import { convertToDisplay, formatCurrency } from "@/lib/richbuild/currency";

const RANGE_NAME: Record<RangeKey, string> = {
  "1D": "1 day",
  "7D": "7 days",
  "1M": "1 month",
  "3M": "3 months",
  "9M": "9 months",
  YTD: "Year to date",
  "1Y": "1 year",
  All: "All time",
};

function formatQty(qty: number) {
  return Number.isInteger(qty) ? qty.toLocaleString("en-US") : qty.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export default function HoldingDetailPage() {
  const params = useParams<{ ticker: string }>();
  const ticker = decodeURIComponent(params.ticker);
  const { holdings } = useHoldings();
  const holding = holdings.find((h) => h.ticker === ticker);
  const market = holding?.market ?? (/\.(KS|KQ)$/i.test(ticker) ? "kr" : "us");
  const { data, isLoading, isError } = useRichbuildIndicator(ticker, holding?.buyPrice ?? null);
  const { currency } = useDisplayPrefs();
  const { data: fxRates } = useFxRates(true);
  const [range, setRange] = useState<RangeKey>("3M");
  const { data: historyData, isFetching: historyPending } = useHistory([ticker], range);
  const chartHistory = historyData?.[ticker] ?? data?.history ?? [];

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
    return <EmptyState glyph="!" title="Couldn't load this ticker" description="Market data is temporarily unavailable — try again shortly." />;
  }

  const { stopLoss, heat, price } = data;
  const trendUp = chartHistory.length > 1 && chartHistory[chartHistory.length - 1] >= chartHistory[0];

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
              {formatQty(holding.quantity)} shares ·{" "}
              {formatCurrency(convertToDisplay(price * holding.quantity, market, currency, fxRates), currency)} total
            </p>
          )}
        </div>
      </div>

      <Card>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[var(--text-xs)] text-[var(--text-muted)]">Trend</span>
          <RangeDropdown value={range} onChange={setRange} names={RANGE_NAME} />
        </div>
        {historyPending && chartHistory.length < 2 ? (
          <Skeleton className="h-[72px] w-full" />
        ) : chartHistory.length > 1 ? (
          <Sparkline data={chartHistory} height={72} stroke={trendUp ? "var(--price-up)" : "var(--price-down)"} />
        ) : (
          <p className="py-4 text-center text-[var(--text-sm)] text-[var(--text-muted)]">No chart data for this range.</p>
        )}
      </Card>

      <Card>
        <CardHeader title="Attention Heat Index" action={<span className="font-display text-[var(--text-2xl)] font-bold text-[var(--text-primary)]">{heat.score}</span>} />
        <div className="flex flex-col gap-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
          <span>
            Volume {heat.volumeMultiple}× · Return Z {heat.returnZ}
          </span>
          {heat.retailNetBuyPct != null && <span>Retail net-buy {heat.retailNetBuyPct}%</span>}
        </div>
      </Card>

      <Card>
        <CardHeader title="Stop-Loss Indicator" />
        <p className="font-semibold text-[var(--text-primary)]">&ldquo;{stopLoss.sentence}&rdquo;</p>
        <div className="mt-2 flex flex-col gap-1 text-[var(--text-sm)] text-[var(--text-secondary)]">
          <span>Loss Severity {stopLoss.lossSeverity != null ? stopLoss.lossSeverity : stopLoss.buyPriceProvided ? "🔒" : "— (add a buy price)"}</span>
          <span>Downtrend Signal {stopLoss.downtrendSignal}</span>
          {stopLoss.breakEvenPct != null && stopLoss.breakEvenPct > 0 && <span>Needs +{stopLoss.breakEvenPct.toFixed(1)}% to break even</span>}
        </div>
        {stopLoss.buyPriceProvided && stopLoss.lossSeverity == null && (
          <Link
            href={`/richbuild/login?redirectTo=${encodeURIComponent(`/richbuild/holding/${encodeURIComponent(ticker)}`)}`}
            className="mt-2 inline-block text-[var(--text-sm)] font-semibold text-[var(--accent)]"
          >
            Sign up to see Loss Severity →
          </Link>
        )}
        <p className="mt-3 text-[var(--text-xs)] text-[var(--text-muted)]">Closing price as of {stopLoss.asOfDate}</p>
        <p className="mt-3 text-[var(--text-xs)] text-[var(--text-muted)]">This indicator is a calculated result, not investment advice.</p>
      </Card>
    </div>
  );
}
