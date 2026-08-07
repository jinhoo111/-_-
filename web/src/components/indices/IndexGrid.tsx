import { type ReactNode } from "react";

export function IndexGrid({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <div className="font-display text-[var(--text-md)] font-semibold text-[var(--text-primary)]">{title}</div>
        {subtitle && <span className="text-[var(--text-xs)] text-[var(--text-muted)]">{subtitle}</span>}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{children}</div>
    </div>
  );
}
