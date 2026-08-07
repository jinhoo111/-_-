"use client";

import { useState } from "react";

export function TickerRow({
  symbol,
  name,
  sub,
  value,
  change,
  onClick,
  className = "",
}: {
  symbol: string;
  name: React.ReactNode;
  sub?: React.ReactNode;
  value: React.ReactNode;
  change?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const [hover, setHover] = useState(false);
  const initials = (symbol || "?").slice(0, 2).toUpperCase();
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`flex min-h-[56px] items-center justify-between gap-4 rounded-[var(--radius-md)] px-3 py-2 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
        hover && onClick ? "bg-[var(--surface-2)]" : "bg-transparent"
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] font-display text-[var(--text-sm)] font-bold text-[var(--accent)]">
          {initials}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[var(--text-base)] font-semibold text-[var(--text-primary)]">{name}</div>
          {sub ? <div className="mt-0.5 text-[var(--text-xs)] text-[var(--text-muted)]">{sub}</div> : null}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-mono text-[var(--text-base)] text-[var(--text-primary)]">{value}</div>
        {change ? <div className="mt-0.5">{change}</div> : null}
      </div>
    </div>
  );
}
