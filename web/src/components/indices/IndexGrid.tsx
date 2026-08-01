import { type ReactNode } from "react";

export function IndexGrid({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[var(--text-md)] font-semibold text-[var(--color-text-primary)]">{title}</div>
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(135px, 1fr))" }}>
        {children}
      </div>
    </div>
  );
}
