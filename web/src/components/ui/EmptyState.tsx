export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <p className="text-[var(--text-lg)] font-medium text-[var(--color-text-secondary)]">{title}</p>
      {description && <p className="text-[var(--text-md)] text-[var(--color-text-tertiary)]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
