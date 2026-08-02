import { type ReactNode } from "react";

export function IndexGrid({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-1.5">
        <div className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{title}</div>
        {subtitle && <span className="text-[var(--text-2xs)] text-[var(--color-text-disabled)]">{subtitle}</span>}
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(135px, 1fr))" }}>
        {children}
      </div>
    </div>
  );
}
