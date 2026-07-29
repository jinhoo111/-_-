import { type HTMLAttributes } from "react";

export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-[var(--radius-md)] bg-[var(--color-bg-overlay)] ${className}`}
      {...props}
    />
  );
}
