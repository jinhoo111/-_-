import { type HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`min-w-0 rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-[var(--space-6)] shadow-[var(--shadow-card)] ${className}`}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = "",
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {title ? (
          <div className="font-display text-[var(--text-lg)] font-semibold tracking-[var(--tracking-heading)] text-[var(--color-text-primary)]">
            {title}
          </div>
        ) : null}
        {subtitle ? (
          <div className="mt-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">{subtitle}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
