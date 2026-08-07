// DROP-IN replacement for web/src/components/indices/IndexCard.tsx
// Matches the mockup's compact StatCard: 20px radius card, mono value,
// % + absolute delta side by side, market-status LABEL (not dot-only),
// and a 36px sparkline. New optional props: sparkData, delta.
// If the quotes API has no intraday series, derive one:
//   syntheticSeries(changePercent) — same util the portfolio page uses.
import { PriceChange } from "@/components/ui/PriceChange";
import { MarketStatus, type MarketState } from "@/components/ui/MarketStatus";
import { Sparkline } from "@/components/ui/Sparkline";

const STATE_LABEL_KEY: Record<string, string> = {
  PRE: "market.state.pre",
  POST: "market.state.after",
  REGULAR: "market.state.delayed",
  CLOSED: "market.state.close",
};

const STATE_TO_MARKET_STATE: Record<string, MarketState> = {
  REGULAR: "open",
  PRE: "pre",
  POST: "pre",
  CLOSED: "closed",
};

export type IndexCardStatus = "loading" | "error" | "empty" | "ok";

export function IndexCard({
  name,
  value,
  changePercent,
  delta,
  sparkData,
  href,
  noDataLabel,
  state,
  stateLabel,
  status = "ok",
  loadingLabel,
  errorLabel,
}: {
  name: string;
  value: string | null;
  changePercent: number | null;
  /** Absolute change, preformatted ("+24.87", "−2.60") — rendered beside the %. */
  delta?: string | null;
  /** Series for the 36px sparkline. Use syntheticSeries(changePercent) when no real data. */
  sparkData?: number[] | null;
  href?: string;
  noDataLabel: string;
  state?: string;
  stateLabel?: (key: string) => string;
  status?: IndexCardStatus;
  loadingLabel?: string;
  errorLabel?: string;
}) {
  let displayValue: string;
  if (status === "loading") displayValue = loadingLabel ?? noDataLabel;
  else if (status === "error") displayValue = errorLabel ?? noDataLabel;
  else if (status === "empty" || value == null) displayValue = noDataLabel;
  else displayValue = value;

  const losing = (changePercent ?? 0) < 0;

  const content = (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-1)] px-5 py-4 shadow-[var(--shadow-card)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:border-[var(--border-strong)]">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[var(--text-sm)] font-medium text-[var(--text-secondary)]">{name}</span>
        {state ? (
          <MarketStatus
            status={STATE_TO_MARKET_STATE[state] ?? "closed"}
            label={stateLabel ? stateLabel(STATE_LABEL_KEY[state] || "market.state.close") : ""}
            className="shrink-0"
          />
        ) : href ? (
          <span className="shrink-0 text-[var(--text-xs)] text-[var(--text-muted)]">↗</span>
        ) : null}
      </div>
      <div className="truncate font-mono text-[var(--text-xl)] font-semibold tracking-[var(--tracking-mono-big)] leading-[var(--leading-tight)] text-[var(--text-primary)]">
        {displayValue}
      </div>
      {changePercent != null && (
        <div className="flex items-center gap-2">
          <PriceChange value={changePercent} size="sm" />
          {delta ? (
            <span className="truncate font-mono text-[var(--text-xs)] text-[var(--text-secondary)]">{delta}</span>
          ) : null}
        </div>
      )}
      {sparkData && sparkData.length > 1 ? (
        <div className="mt-1">
          <Sparkline
            data={sparkData}
            height={36}
            fill={!losing}
            stroke={losing ? "var(--price-down)" : "var(--chart-line)"}
          />
        </div>
      ) : null}
    </div>
  );

  if (!href) return content;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="block hover:opacity-80">
      {content}
    </a>
  );
}
