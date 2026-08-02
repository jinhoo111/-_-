export function EmptyState({
  title,
  description,
  action,
  onRetry,
  retryLabel,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-[var(--space-8)] text-center">
      <p className="text-[var(--text-lg)] font-medium text-[var(--color-text-secondary)]">{title}</p>
      {description && <p className="text-[var(--text-md)] text-[var(--color-text-tertiary)]">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-[var(--radius-control)] bg-[var(--color-error)] px-3 py-1 text-[var(--text-sm)] font-semibold text-white hover:brightness-110"
        >
          {retryLabel}
        </button>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
