export function EmptyState({
  glyph = "◎",
  title,
  description,
  action,
  onRetry,
  retryLabel,
}: {
  glyph?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--surface-2)] text-2xl text-[var(--text-muted)]">
        {glyph}
      </span>
      <p className="font-display text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{title}</p>
      {description && (
        <p className="max-w-[320px] text-[var(--text-sm)] leading-[var(--leading-normal)] text-[var(--color-text-secondary)]">
          {description}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-[var(--radius-control)] bg-[var(--color-error)] px-3 py-1 text-[var(--text-sm)] font-semibold text-white hover:brightness-110"
        >
          {retryLabel}
        </button>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
