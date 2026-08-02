const STATE_LABEL_KEY: Record<string, string> = {
  PRE: "market.state.pre",
  POST: "market.state.after",
  REGULAR: "market.state.delayed",
  CLOSED: "market.state.close",
};

export type IndexCardStatus = "loading" | "error" | "empty" | "ok";

export function IndexCard({
  name,
  value,
  changePercent,
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
  href?: string;
  noDataLabel: string;
  state?: string;
  stateLabel?: (key: string) => string;
  status?: IndexCardStatus;
  loadingLabel?: string;
  errorLabel?: string;
}) {
  const up = changePercent != null && changePercent >= 0;
  const colorClass = changePercent == null ? "text-[var(--color-text-tertiary)]" : up ? "text-[var(--color-up)]" : "text-[var(--color-down)]";

  let displayValue: string;
  if (status === "loading") displayValue = loadingLabel ?? noDataLabel;
  else if (status === "error") displayValue = errorLabel ?? noDataLabel;
  else if (status === "empty" || value == null) displayValue = noDataLabel;
  else displayValue = value;

  const content = (
    <div className="flex min-w-0 flex-col gap-1 rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2.5">
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{name}</span>
        {href && <span className="shrink-0 text-[var(--text-xs)] text-[var(--color-text-disabled)]">↗</span>}
      </div>
      <div className="truncate font-mono text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">{displayValue}</div>
      {changePercent != null && (
        <div className={`flex items-center gap-1 text-[var(--text-sm)] font-semibold ${colorClass}`}>
          <span className="shrink-0">
            {up ? "▲" : "▼"} {Math.abs(changePercent).toFixed(2)}%
          </span>
          {state && stateLabel && (
            <span className="truncate text-[var(--text-2xs)] font-normal text-[var(--color-text-disabled)]">
              {stateLabel(STATE_LABEL_KEY[state] || "market.state.close")}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (!href) return content;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="block hover:opacity-80">
      {content}
    </a>
  );
}
