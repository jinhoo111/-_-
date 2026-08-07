export type MarketState = "open" | "pre" | "closed";

const CFG: Record<MarketState, { color: string; dotBg: string; shadow?: string }> = {
  open: { color: "var(--positive)", dotBg: "var(--positive)", shadow: "var(--positive-soft)" },
  pre: { color: "var(--warning)", dotBg: "var(--warning)" },
  closed: { color: "var(--text-muted)", dotBg: "var(--text-muted)" },
};

export function MarketStatus({
  status,
  label,
  hours,
  className = "",
}: {
  status: MarketState;
  label: string;
  hours?: string;
  className?: string;
}) {
  const cfg = CFG[status] ?? CFG.closed;
  return (
    <span
      title={hours}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[var(--text-xs)] ${status === "closed" ? "text-[var(--text-muted)]" : ""} ${className}`}
      style={{ color: status === "closed" ? "var(--text-muted)" : cfg.color }}
    >
      <span
        className="h-[7px] w-[7px] rounded-full"
        style={{
          background: cfg.dotBg,
          boxShadow: status === "open" ? `0 0 0 3px ${cfg.shadow}` : "none",
        }}
      />
      {label}
    </span>
  );
}
