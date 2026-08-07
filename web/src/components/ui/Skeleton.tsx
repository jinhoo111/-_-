import { type HTMLAttributes } from "react";

export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`block rounded-[var(--radius-sm)] [background:linear-gradient(90deg,var(--surface-2)_25%,var(--surface-3)_50%,var(--surface-2)_75%)] [background-size:200%_100%] [animation:minted-shimmer_1.4s_ease-in-out_infinite] ${className}`}
      {...props}
    />
  );
}
