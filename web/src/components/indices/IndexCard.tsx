const STATE_LABEL_KEY: Record<string, string> = {
  PRE: "market.state.pre",
  POST: "market.state.after",
  REGULAR: "market.state.delayed",
  CLOSED: "market.state.close",
};

export function IndexCard({
  name,
  value,
  changePercent,
  href,
  noDataLabel,
  state,
  stateLabel,
}: {
  name: string;
  value: string | null;
  changePercent: number | null;
  href?: string;
  noDataLabel: string;
  state?: string;
  stateLabel?: (key: string) => string;
}) {
  const up = changePercent != null && changePercent >= 0;
  const colorClass = changePercent == null ? "text-[var(--color-text-tertiary)]" : up ? "text-[var(--color-up)]" : "text-[var(--color-down)]";

  const content = (
    <div className="flex flex-col gap-1 rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2.5">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">{name}</span>
        {href && <span className="text-[var(--text-xs)] text-[var(--color-text-disabled)]">↗</span>}
      </div>
      <div className="font-mono text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">{value ?? noDataLabel}</div>
      {changePercent != null && (
        <div className={`flex items-center gap-1 text-[var(--text-sm)] font-semibold ${colorClass}`}>
          <span>
            {up ? "▲" : "▼"} {Math.abs(changePercent).toFixed(2)}%
          </span>
          {state && stateLabel && (
            <span className="text-[var(--text-2xs)] font-normal text-[var(--color-text-disabled)]">{stateLabel(STATE_LABEL_KEY[state] || "market.state.close")}</span>
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
