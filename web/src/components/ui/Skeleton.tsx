import { type HTMLAttributes } from "react";

export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-skeleton block rounded-[var(--radius-sm)] [background:linear-gradient(100deg,var(--surface-1)_30%,var(--surface-3)_50%,var(--surface-1)_70%)] ${className}`}
      {...props}
    />
  );
}
