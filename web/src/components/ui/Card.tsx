import { type HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`min-w-0 rounded-[var(--radius-3xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-[var(--space-4)] shadow-[var(--shadow-card)] sm:p-[var(--space-5)] ${className}`}
      {...props}
    />
  );
}
