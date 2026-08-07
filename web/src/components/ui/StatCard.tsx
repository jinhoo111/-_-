export function StatCard({
  label,
  value,
  change,
  note,
  spark,
  action,
  compact = false,
  className = "",
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  change?: React.ReactNode;
  note?: React.ReactNode;
  spark?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--surface-1)] shadow-[var(--shadow-card)] ${
        compact ? "gap-1.5 px-5 py-4" : "gap-2.5 p-6"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[var(--text-sm)] font-medium text-[var(--text-secondary)]">{label}</div>
        {action || null}
      </div>
      <div className="font-mono text-[var(--text-2xl)] font-semibold leading-[var(--leading-tight)] tracking-[var(--tracking-mono-big)] text-[var(--text-primary)]">
        {value}
      </div>
      {change || note ? (
        <div className="flex items-center gap-2.5">
          {change || null}
          {note ? <span className="text-[var(--text-xs)] text-[var(--text-muted)]">{note}</span> : null}
        </div>
      ) : null}
      {spark ? <div className="mt-1">{spark}</div> : null}
    </div>
  );
}
