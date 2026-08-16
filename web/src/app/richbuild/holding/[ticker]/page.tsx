"use client";

import { useParams } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useHoldings } from "@/lib/queries/useHoldings";
import { useRichbuildIndicator } from "@/lib/queries/useRichbuildIndicator";

function formatPrice(price: number, market: "kr" | "us") {
  return market === "kr" ? `₩${Math.round(price).toLocaleString()}` : `$${price.toFixed(2)}`;
}

export default function HoldingDetailPage() {
  const params = useParams<{ ticker: string }>();
  const ticker = decodeURIComponent(params.ticker);
  const { holdings } = useHoldings();
  const holding = holdings.find((h) => h.ticker === ticker);
  const market = holding?.market ?? (/\.(KS|KQ)$/i.test(ticker) ? "kr" : "us");
  const { data, isLoading, isError } = useRichbuildIndicator(ticker, holding?.buyPrice ?? null);

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

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <div>
        <h1 className="font-display text-[var(--text-lg)] font-semibold text-[var(--text-primary)]">{holding?.name ?? ticker}</h1>
        <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
          {ticker} · {formatPrice(price, market)}
        </p>
      </div>

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
          <span>Loss Severity {stopLoss.lossSeverity != null ? stopLoss.lossSeverity : "— (add a buy price)"}</span>
          <span>Downtrend Signal {stopLoss.downtrendSignal}</span>
          {stopLoss.breakEvenPct != null && stopLoss.breakEvenPct > 0 && <span>Needs +{stopLoss.breakEvenPct.toFixed(1)}% to break even</span>}
        </div>
        <p className="mt-3 text-[var(--text-xs)] text-[var(--text-muted)]">Closing price as of {stopLoss.asOfDate}</p>
        <p className="mt-3 text-[var(--text-xs)] text-[var(--text-muted)]">This indicator is a calculated result, not investment advice.</p>
      </Card>
    </div>
  );
}
