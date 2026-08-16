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
    <div className={`flex items-center justify-between gap-4 border-b border-[var(--border-default)] pb-6 ${className}`}>
      <div className="min-w-0">
        <h1 className="font-display text-[var(--text-2xl)] font-bold leading-[var(--leading-tight)] tracking-[var(--tracking-heading)] text-[var(--text-primary)]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-[var(--text-base)] leading-[var(--leading-normal)] text-[var(--text-secondary)]">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}
