export function PageHeader({
  title,
  subtitle,
  action,
  className = "",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h1 className="font-display text-[var(--text-2xl)] font-bold tracking-[var(--tracking-heading)] text-[var(--text-primary)]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 text-[var(--text-base)] text-[var(--text-secondary)]">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
